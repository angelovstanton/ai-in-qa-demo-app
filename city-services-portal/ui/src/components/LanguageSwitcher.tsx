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
} from '@mui/material';
import {
  Language as LanguageIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useLanguage, Language } from '../contexts/LanguageContext';

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: LanguageOption[] = [
  {
    code: 'EN',
    name: 'English',
    nativeName: 'English',
    flag: '????',
  },
  {
    code: 'BG',
    name: 'Bulgarian',
    nativeName: '?????????',
    flag: '????',
  },
];

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
  const { language, setLanguage, t } = useLanguage();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const currentLanguage = languages.find(lang => lang.code === language);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageSelect = (languageCode: Language) => {
    setLanguage(languageCode);
    handleClose();
  };

  if (variant === 'icon') {
    return (
      <>
        <Tooltip title={t('nav.language-switcher') || 'Language'}>
          <IconButton
            onClick={handleClick}
            color={color}
            data-testid="cs-language-switcher"
            aria-label="Change language"
            aria-controls={open ? 'language-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
          >
            {showFlags && currentLanguage ? (
              <Typography sx={{ fontSize: '1.2rem' }} role="img" aria-label={currentLanguage.name}>
                {currentLanguage.flag}
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
          {languages.map((lang) => (
            <MenuItem
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              selected={lang.code === language}
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
                    <Typography variant="body2" fontWeight={lang.code === language ? 'bold' : 'normal'}>
                      {lang.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {lang.nativeName}
                    </Typography>
                  </Box>
                  
                  {lang.code === language && (
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