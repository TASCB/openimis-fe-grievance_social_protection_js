/* eslint-disable react/destructuring-assignment */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { injectIntl } from 'react-intl';
import { withStyles, withTheme } from '@material-ui/core/styles';
import {
  Paper, Typography, Grid, IconButton, Tooltip, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem,
  ListItemIcon, ListItemText, ListItemSecondaryAction, Chip, CircularProgress,
} from '@material-ui/core';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import VisibilityIcon from '@material-ui/icons/Visibility';
import GetAppIcon from '@material-ui/icons/GetApp';
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';
import ImageIcon from '@material-ui/icons/Image';
import VideocamIcon from '@material-ui/icons/Videocam';
import AudiotrackIcon from '@material-ui/icons/Audiotrack';
import PictureAsPdfIcon from '@material-ui/icons/PictureAsPdf';
import DescriptionIcon from '@material-ui/icons/Description';
import DeleteIcon from '@material-ui/icons/Delete';
import { FormattedMessage, formatMessage } from '@openimis/fe-core';
import {
  fetchTicketAttachments, uploadTicketAttachments,
  clearPendingAttachments, attachmentDownloadUrl, downloadAttachment,
} from '../actions';
import { MODULE_NAME, TICKET_STATUSES } from '../constants';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_MIMES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/wav', 'audio/ogg',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const ACCEPT = ALLOWED_MIMES.join(',');

const styles = (theme) => ({
  paper: theme.paper.paper,
  tableTitle: theme.table.title,
  item: theme.paper.item,
  previewBox: { width: '100%', maxHeight: '70vh', overflow: 'auto' },
});

function iconFor(mime) {
  if (!mime) return <InsertDriveFileIcon />;
  if (mime.startsWith('image/')) return <ImageIcon />;
  if (mime.startsWith('video/')) return <VideocamIcon />;
  if (mime.startsWith('audio/')) return <AudiotrackIcon />;
  if (mime === 'application/pdf') return <PictureAsPdfIcon />;
  if (mime.includes('excel') || mime.includes('spreadsheet')) return <DescriptionIcon />;
  return <InsertDriveFileIcon />;
}

function isPreviewable(mime) {
  if (!mime) return false;
  return (
    mime.startsWith('image/')
    || mime.startsWith('video/')
    || mime.startsWith('audio/')
    || mime === 'application/pdf'
  );
}

class TicketAttachmentsPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      previewing: null,
      errors: [],
      uploadedPending: false,
    };
    this.fileInputRef = React.createRef();
  }

  componentDidMount() {
    if (this.props.edited?.id) {
      this.props.fetchTicketAttachments(this.props.edited);
      this.flushPendingIfNeeded();
    }
  }

  componentDidUpdate(prevProps) {
    const prevId = prevProps.edited?.id;
    const currId = this.props.edited?.id;
    if (currId && currId !== prevId) {
      this.props.fetchTicketAttachments(this.props.edited);
    }
    if (prevProps.uploadingAttachments && !this.props.uploadingAttachments) {
      this.props.fetchTicketAttachments(this.props.edited);
    }
    if (!prevId && currId) {
      this.flushPendingIfNeeded();
    }
  }

  flushPendingIfNeeded = async () => {
    const { edited, pendingAttachments } = this.props;
    if (this.state.uploadedPending) return;
    if (!edited?.id) return;
    if (!pendingAttachments || pendingAttachments.length === 0) return;
    this.setState({ uploadedPending: true });
    const result = await this.props.uploadTicketAttachments(edited.id, pendingAttachments);
    if (!result?.error && (!result?.errors || result.errors.length === 0)) {
      this.props.clearPendingAttachments();
      return;
    }
    this.setState({ uploadedPending: false });
  };

  isReadOnly = () => this.props?.edited?.status === TICKET_STATUSES.CLOSED
    || this.props?.edited?.isHistory;

  validateFiles = (files) => {
    const errors = [];
    const valid = [];
    const existing = this.props.ticketAttachments?.length || 0;
    for (const f of files) {
      if (existing + valid.length >= MAX_FILES) {
        errors.push(`${f.name}: attachment limit ${MAX_FILES} reached`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        errors.push(`${f.name}: exceeds 25MB`);
        continue;
      }
      const mime = (f.type || '').toLowerCase();
      if (!ALLOWED_MIMES.includes(mime)) {
        errors.push(`${f.name}: type ${mime || 'unknown'} not allowed`);
        continue;
      }
      valid.push(f);
    }
    return { valid, errors };
  };

  handleFiles = async (event) => {
    const picked = Array.from(event.target.files || []);
    event.target.value = '';
    if (picked.length === 0) return;
    const { valid, errors } = this.validateFiles(picked);
    this.setState({ errors });
    if (valid.length === 0) return;
    const result = await this.props.uploadTicketAttachments(this.props.edited.id, valid);
    if (result?.error || (result?.errors && result.errors.length > 0)) {
      this.setState((state) => ({
        errors: [
          ...state.errors,
          ...(result?.errors || []).map((error) => `${error.filename}: ${error.error}`),
          ...(result?.error?.error ? [result.error.error] : []),
        ],
      }));
    }
  };

  openPicker = () => {
    if (this.fileInputRef.current) this.fileInputRef.current.click();
  };

  openPreview = (attachment) => this.setState({ previewing: attachment });

  closePreview = () => this.setState({ previewing: null });

  renderPreview = () => {
    const { previewing } = this.state;
    if (!previewing) return null;
    const url = attachmentDownloadUrl(previewing);
    const mime = previewing.mimeType || '';
    return (
      <Dialog open onClose={this.closePreview} fullWidth maxWidth="md">
        <DialogTitle>{previewing.filename}</DialogTitle>
        <DialogContent>
          <div className={this.props.classes.previewBox}>
            {mime.startsWith('image/') && (
              <img src={url} alt={previewing.filename} style={{ maxWidth: '100%' }} />
            )}
            {mime.startsWith('video/') && (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={url} controls style={{ maxWidth: '100%' }} />
            )}
            {mime.startsWith('audio/') && (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <audio src={url} controls style={{ width: '100%' }} />
            )}
            {mime === 'application/pdf' && (
              <iframe
                title={previewing.filename}
                src={url}
                style={{ width: '100%', height: '70vh', border: 0 }}
              />
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.closePreview}>
            <FormattedMessage module={MODULE_NAME} id="ticket.attachments.close" />
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  render() {
    const {
      classes, ticketAttachments, uploadingAttachments, errorUploadAttachments, intl,
    } = this.props;
    const { errors } = this.state;
    const readOnly = this.isReadOnly();
    const attachments = ticketAttachments || [];
    const uploadErrors = [
      ...(errorUploadAttachments?.errors || []).map((error) => `${error.filename}: ${error.error}`),
      ...(errorUploadAttachments?.error ? [errorUploadAttachments.error] : []),
    ];

    return (
      <Paper className={classes.paper}>
        <Grid container className={classes.tableTitle} alignItems="center">
          <Grid item xs={8} className={classes.tableTitle}>
            <Typography>
              <FormattedMessage module={MODULE_NAME} id="ticket.attachments.table" />
              {' '}
              <Chip size="small" label={attachments.length} />
            </Typography>
          </Grid>
          <Grid item xs={4} style={{ textAlign: 'right' }}>
            {!readOnly && (
              <>
                <input
                  ref={this.fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPT}
                  style={{ display: 'none' }}
                  onChange={this.handleFiles}
                />
                <Tooltip title={formatMessage(intl, MODULE_NAME, 'ticket.attachments.upload')}>
                  <span>
                    <IconButton
                      onClick={this.openPicker}
                      disabled={uploadingAttachments || attachments.length >= MAX_FILES}
                    >
                      {uploadingAttachments ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                    </IconButton>
                  </span>
                </Tooltip>
              </>
            )}
          </Grid>
        </Grid>
        {errors.length > 0 && (
          <Grid container className={classes.item}>
            <Grid item xs={12}>
              {errors.map((e) => (
                <Typography key={e} color="error" variant="caption" display="block">{e}</Typography>
              ))}
              {uploadErrors.map((e) => (
                <Typography key={e} color="error" variant="caption" display="block">{e}</Typography>
              ))}
            </Grid>
          </Grid>
        )}
        <List>
          {attachments.length === 0 && (
            <ListItem>
              <ListItemText
                primary={<FormattedMessage module={MODULE_NAME} id="ticket.attachments.empty" />}
              />
            </ListItem>
          )}
          {attachments.map((att) => (
            <ListItem key={att.id}>
              <ListItemIcon>{iconFor(att.mimeType)}</ListItemIcon>
              <ListItemText primary={att.filename} secondary={att.mimeType} />
              <ListItemSecondaryAction>
                {isPreviewable(att.mimeType) && (
                  <Tooltip title={formatMessage(intl, MODULE_NAME, 'ticket.attachments.preview')}>
                    <IconButton onClick={() => this.openPreview(att)}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title={formatMessage(intl, MODULE_NAME, 'ticket.attachments.download')}>
                  <IconButton onClick={downloadAttachment(att)}>
                    <GetAppIcon />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
        {this.renderPreview()}
      </Paper>
    );
  }
}

const mapStateToProps = (state) => ({
  ticketAttachments: state.grievanceSocialProtection.ticketAttachments,
  uploadingAttachments: state.grievanceSocialProtection.uploadingAttachments,
  pendingAttachments: state.grievanceSocialProtection.pendingAttachments,
  errorUploadAttachments: state.grievanceSocialProtection.errorUploadAttachments,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  fetchTicketAttachments, uploadTicketAttachments, clearPendingAttachments,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(
  injectIntl(withTheme(withStyles(styles)(TicketAttachmentsPanel))),
);
