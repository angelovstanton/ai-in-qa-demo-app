import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  CircularProgress,
  Tooltip,
  Badge
} from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import CheckIcon from '@mui/icons-material/Check';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

export const LanguageSelector: React.FC = () => {
  const { currentLanguage, changeLanguage, isChangingLanguage, supportedLanguages } = useLanguage();
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = async (languageCode: typeof currentLanguage) => {
    try {
      await changeLanguage(languageCode);
      handleClose();
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const currentLang = supportedLanguages.find(lang => lang.code === currentLanguage);

  return (
    <>
      <Tooltip title={t('common.language')}>
        <IconButton
          onClick={handleClick}
          color="inherit"
          aria-label="change language"
          data-testid="cs-language-selector"
          disabled={isChangingLanguage}
        >
          {isChangingLanguage ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            <Badge badgeContent={currentLang?.flag} overlap="circular">
              <LanguageIcon />
            </Badge>
          )}
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: 200,
            mt: 1.5,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1.5,
              borderRadius: 1,
              mx: 0.5,
              my: 0.25,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {t('common.selectLanguage', 'Select Language')}
          </Typography>
        </Box>
        <Divider />
        {supportedLanguages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            selected={currentLanguage === language.code}
            data-testid={`cs-language-option-${language.code}`}
          >
            <ListItemIcon>
              <Typography variant="h6" component="span">
                {language.flag}
              </Typography>
            </ListItemIcon>
            <ListItemText
              primary={language.nativeName}
              secondary={language.name}
            />
            {currentLanguage === language.code && (
              <CheckIcon fontSize="small" color="primary" sx={{ ml: 1 }} />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

// Compact version for mobile or limited space
export const CompactLanguageSelector: React.FC = () => {
  const { currentLanguage, changeLanguage, isChangingLanguage, supportedLanguages } = useLanguage();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = async (languageCode: typeof currentLanguage) => {
    try {
      await changeLanguage(languageCode);
      handleClose();
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const currentLang = supportedLanguages.find(lang => lang.code === currentLanguage);

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        disabled={isChangingLanguage}
        data-testid="cs-compact-language-selector"
        sx={{ 
          fontSize: '1.5rem',
          p: 0.5,
          minWidth: 'auto'
        }}
      >
        {isChangingLanguage ? (
          <CircularProgress size={20} />
        ) : (
          <span>{currentLang?.flag}</span>
        )}
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            '& .MuiList-root': {
              p: 0.5,
            },
            '& .MuiMenuItem-root': {
              minHeight: 'auto',
              px: 1.5,
              py: 1,
            },
          },
        }}
      >
        {supportedLanguages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            selected={currentLanguage === language.code}
            dense
          >
            <Typography component="span" sx={{ mr: 1 }}>
              {language.flag}
            </Typography>
            <Typography variant="body2">
              {language.code.toUpperCase()}
            </Typography>
            {currentLanguage === language.code && (
              <CheckIcon fontSize="small" sx={{ ml: 1 }} />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};