import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  coreAlert,
  useModulesManager,
  useTranslations,
} from '@openimis/fe-core';
import { fetchGrievanceConfiguration } from '../actions';
import {
  MODULE_NAME,
  RIGHT_TICKET,
  RIGHT_TICKET_ADD,
  RIGHT_TICKET_DELETE,
  RIGHT_TICKET_EDIT,
  RIGHT_TICKET_SEARCH,
} from '../constants';

function GrievanceConfigurationDialog({
  rights = [],
}) {
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_NAME, modulesManager);
  const dispatch = useDispatch();
  const grievanceConfiguration = useSelector((state) => state?.grievanceSocialProtection?.grievanceConfig);
  const fetchedGrievanceConfig = useSelector((state) => state?.grievanceSocialProtection?.fetchedGrievanceConfig);

  const doesUserHaveRights = () => {
    const rightsArray = [
      RIGHT_TICKET,
      RIGHT_TICKET_SEARCH,
      RIGHT_TICKET_ADD,
      RIGHT_TICKET_EDIT,
      RIGHT_TICKET_DELETE,
    ];
    return rightsArray.every((right) => rights.includes(right));
  };
  const isMatchingConfigObject = (obj) => !(typeof obj !== 'object' || obj === null || Array.isArray(obj));

  const isConfigMissing = (config) => Object.values(config).some((field) => {
    if (Array.isArray(field) && field.length === 0) {
      return true;
    }
    if (typeof field === 'object' && Object.keys(field).length === 0) {
      return true;
    }
    return !field;
  });

  const shouldDisplay = () => grievanceConfiguration
        && doesUserHaveRights()
        && isMatchingConfigObject(grievanceConfiguration)
        && isConfigMissing(grievanceConfiguration);

  useEffect(() => {
    if (shouldDisplay()) {
      const configString = JSON.stringify(grievanceConfiguration);
      dispatch(coreAlert(
        formatMessage('grievanceSocialProtection.dialogs.GrievanceConfigurationDialog.dialogHeader'),
        formatMessageWithValues(
          'grievanceSocialProtection.dialogs.GrievanceConfigurationDialog.dialogBody',
          { configString },
        ),
      ));
    }
  }, [grievanceConfiguration]);

  useEffect(() => {
    if (!fetchedGrievanceConfig && doesUserHaveRights()) {
      dispatch(fetchGrievanceConfiguration());
    }
  }, [fetchedGrievanceConfig, rights]);

  return null;
}

export default GrievanceConfigurationDialog;
