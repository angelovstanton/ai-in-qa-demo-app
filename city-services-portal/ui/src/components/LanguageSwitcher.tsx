import React from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  Language as LanguageIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';


interface LanguageSwitcherProps {
  variant?: 'icon' | 'button' | 'dropdown';
  showFlags?: boolean;
  color?: 'inherit' | 'primary' | 'secondary' | 'default';
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'icon',
  showFlags = true,
  color = 'inherit',
}) => {
  const { currentLanguage, changeLanguage, isChangingLanguage, supportedLanguages } = useLanguage();
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const currentLang = supportedLanguages.find(lang => lang.code === currentLanguage);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageSelect = async (languageCode: typeof currentLanguage) => {
    try {
      await changeLanguage(languageCode);
      handleClose();
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  if (variant === 'icon') {
    return (
      <>
        <Tooltip title={t('common.language')}>
          <IconButton
            onClick={handleClick}
            color={color}
            data-testid="cs-language-switcher"
            aria-label="Change language"
            aria-controls={open ? 'language-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            disabled={isChangingLanguage}
          >
            {isChangingLanguage ? (
              <CircularProgress size={24} color="inherit" />
            ) : showFlags && currentLang ? (
              <Typography sx={{ fontSize: '1.2rem' }} role="img" aria-label={currentLang.name}>
                {currentLang.flag}
              </Typography>
            ) : (
              <LanguageIcon />
            )}
          </IconButton>
        </Tooltip>

        <Menu
          id="language-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          data-testid="cs-language-menu"
          MenuListProps={{
            'aria-labelledby': 'language-button',
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {supportedLanguages.map((lang) => (
            <MenuItem
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              selected={lang.code === currentLanguage}
              data-testid={`cs-language-option-${lang.code.toLowerCase()}`}
            >
              {showFlags && (
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Typography sx={{ fontSize: '1.2rem' }} role="img" aria-label={lang.name}>
                    {lang.flag}
                  </Typography>
                </ListItemIcon>
              )}
              
              <ListItemText>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" fontWeight={lang.code === currentLanguage ? 'bold' : 'normal'}>
                      {lang.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {lang.nativeName}
                    </Typography>
                  </Box>
                  
                  {lang.code === currentLanguage && (
                    <CheckIcon color="primary" sx={{ ml: 1 }} />
                  )}
                </Box>
              </ListItemText>
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  }

  // Add other variants (button, dropdown) if needed in the future
  return null;
};

export default LanguageSwitcher;