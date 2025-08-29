import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Language types
export type Language = 'EN' | 'BG' | 'ES' | 'FR';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

// Translation keys and values
const translations = {
  EN: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.requests': 'My Requests',
    'nav.new-request': 'New Request',
    'nav.resolved-cases': 'Resolved Cases',
    'nav.ranklist': 'Community Ranklist',
    'nav.profile': 'Profile',
    'nav.logout': 'Logout',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.inbox': 'Inbox',
    'nav.assign-tasks': 'Assign Tasks',
    'nav.my-tasks': 'My Tasks',
    'nav.admin-flags': 'Feature Flags',

    // Common UI
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.clear': 'Clear',
    'common.submit': 'Submit',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.close': 'Close',
    'common.refresh': 'Refresh',

    // Login Page
    'login.title': 'City Services Login',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.submit': 'Login',
    'login.register-link': 'Create Account',
    'login.demo-accounts': 'Demo Accounts - Click to Prefill:',
    'login.demo-info': 'All demo accounts use password:',
    'login.loading': 'Logging in...',

    // Demo Account Roles
    'demo.citizen': 'Citizen',
    'demo.citizen.desc': 'Submit and track service requests',
    'demo.clerk': 'Clerk',
    'demo.clerk.desc': 'Process and manage requests',
    'demo.supervisor': 'Supervisor',
    'demo.supervisor.desc': 'Assign tasks and oversee workflow',
    'demo.field-agent': 'Field Agent',
    'demo.field-agent.desc': 'Complete field work and update status',
    'demo.admin': 'Admin',
    'demo.admin.desc': 'System configuration and feature flags',

    // Request Form
    'request.title': 'Request Title',
    'request.description': 'Detailed Description',
    'request.category': 'Category',
    'request.priority': 'Priority',
    'request.date': 'Date of Request',
    'request.street-address': 'Street Address',
    'request.city': 'City',
    'request.postal-code': 'Postal Code',
    'request.location-details': 'Additional Location Details',
    'request.contact-method': 'Preferred Contact Method',
    'request.affected-services': 'Affected Services',
    'request.emergency': 'Is this an emergency?',
    'request.terms': 'I agree to the terms and conditions and confirm that the information provided is accurate',

    // Request Categories
    'category.roads-transportation': 'Roads and Transportation',
    'category.street-lighting': 'Street Lighting',
    'category.waste-management': 'Waste Management',
    'category.water-sewer': 'Water and Sewer',
    'category.parks-recreation': 'Parks and Recreation',
    'category.public-safety': 'Public Safety',
    'category.building-permits': 'Building and Permits',
    'category.snow-removal': 'Snow Removal',
    'category.traffic-signals': 'Traffic Signals',
    'category.sidewalk-maintenance': 'Sidewalk Maintenance',
    'category.tree-services': 'Tree Services',
    'category.noise-complaints': 'Noise Complaints',
    'category.animal-control': 'Animal Control',
    'category.other': 'Other',

    // Request Status
    'status.submitted': 'Submitted',
    'status.triaged': 'Triaged',
    'status.in-progress': 'In Progress',
    'status.waiting-on-citizen': 'Waiting on Citizen',
    'status.resolved': 'Resolved',
    'status.closed': 'Closed',
    'status.rejected': 'Rejected',

    // Priority Levels
    'priority.low': 'Low',
    'priority.medium': 'Medium',
    'priority.high': 'High',
    'priority.urgent': 'Urgent',

    // Contact Methods
    'contact.email': 'Email',
    'contact.phone': 'Phone',
    'contact.sms': 'SMS',
    'contact.mail': 'Mail',

    // Profile Page
    'profile.title': 'Edit Profile',
    'profile.personal-info': 'Personal Information',
    'profile.first-name': 'First Name',
    'profile.last-name': 'Last Name',
    'profile.phone': 'Phone Number',
    'profile.alternate-phone': 'Alternate Phone (Optional)',
    'profile.address': 'Street Address',
    'profile.state': 'State/Province',
    'profile.country': 'Country',
    'profile.preferences': 'Preferences',
    'profile.email-notifications': 'Email Notifications',
    'profile.sms-notifications': 'SMS Notifications',
    'profile.service-updates': 'Service Updates',
    'profile.marketing-emails': 'Marketing Emails',
    'profile.change-password': 'Change Password',
    'profile.current-password': 'Current Password',
    'profile.new-password': 'New Password',
    'profile.confirm-password': 'Confirm New Password',
    'profile.password-strength': 'Password Strength:',
    'profile.security-tips': 'Security Tips',

    // Ranklist Page
    'ranklist.title': 'Community Ranklist',
    'ranklist.subtitle': 'Recognizing citizens who contribute most effectively to community improvement',
    'ranklist.top-contributors': 'Top Contributors',
    'ranklist.total-users': 'Active Citizens',
    'ranklist.total-approved': 'Approved Requests',
    'ranklist.avg-approval-rate': 'Avg Approval Rate',
    'ranklist.top-performer-growth': 'Top Performer Growth',
    'ranklist.timeframe': 'Timeframe',
    'ranklist.all-time': 'All Time',
    'ranklist.this-year': 'This Year',
    'ranklist.this-month': 'This Month',
    'ranklist.how-rankings-work': 'How Rankings Work',

    // Resolved Cases Page
    'resolved.title': 'Resolved Cases',
    'resolved.subtitle': 'Track completed municipal service requests and their outcomes',
    'resolved.total-resolved': 'Total Resolved',
    'resolved.avg-resolution-time': 'Avg Resolution Time',
    'resolved.satisfaction-rate': 'Satisfaction Rate',
    'resolved.monthly-improvement': 'Monthly Improvement',
    'resolved.filters': 'Filters',
    'resolved.clear-filters': 'Clear All',
    'resolved.search-cases': 'Search cases',
    'resolved.all-categories': 'All Categories',
    'resolved.all-priorities': 'All Priorities',
    'resolved.from-date': 'From Date',
    'resolved.to-date': 'To Date',
    'resolved.min-rating': 'Min Rating',

    // Comments and Feedback
    'comments.add': 'Add Comment',
    'comments.submit': 'Submit comment',
    'comments.cancel': 'Cancel',
    'comments.public': 'Public Comment',
    'comments.private': 'Private Comment',
    'comments.public-desc': 'Everyone can see this comment',
    'comments.private-desc': 'Only staff can see this comment',
    'comments.placeholder': 'Share your thoughts about this request... (minimum 10 characters)',
    'comments.no-comments': 'No comments yet. Be the first to share your thoughts!',

    // Upvotes
    'upvotes.button': 'Upvote',
    'upvotes.button-plural': 'Upvotes',
    'upvotes.tooltip-own': 'You cannot upvote your own request',
    'upvotes.tooltip-add': 'Upvote this request',
    'upvotes.tooltip-remove': 'Remove upvote',

    // Edit Request
    'edit.locked': 'Edit Locked',
    'edit.time-expired': 'Editing is only allowed within 10 minutes of submission. This request was created {minutes} minutes ago.',
    'edit.time-remaining': 'You can edit this request for {minutes} more minute(s).',
    'edit.own-only': 'You can only edit your own requests',

    // Image Upload
    'image.upload-title': 'Image Upload',
    'image.drag-drop': 'Drag & drop images or click to browse',
    'image.drop-here': 'Drop images here',
    'image.max-size': 'Supports JPEG and PNG files up to {size}MB each',
    'image.max-images': 'Maximum {count} images allowed',
    'image.uploaded-count': 'Uploaded Images ({count}/{max})',
    'image.delete-confirm': 'Delete Image',

    // Validation Messages
    'validation.required': '{field} is required',
    'validation.email-invalid': 'Please enter a valid email address',
    'validation.password-weak': 'Password must contain: uppercase letter, lowercase letter, number, and special character',
    'validation.passwords-mismatch': 'Passwords do not match',
    'validation.min-length': '{field} must be at least {length} characters',
    'validation.max-length': '{field} must be less than {length} characters',
    'validation.date-past': 'Date cannot be more than 1 month in the past',
    'validation.date-future': 'Date cannot be in the future',
    'validation.phone-invalid': 'Please enter a valid phone number',
    'validation.postal-code-invalid': 'Please enter a valid postal code',
    'validation.xss-detected': 'Content contains potentially harmful elements',
  },

  BG: {
    // Navigation
    'nav.dashboard': 'Табло',
    'nav.requests': 'Моите заявки',
    'nav.new-request': 'Нова заявка',
    'nav.resolved-cases': 'Решени случаи',
    'nav.ranklist': 'Класация на общността',
    'nav.profile': 'Профил',
    'nav.logout': 'Изход',
    'nav.login': 'Вход',
    'nav.register': 'Регистрация',
    'nav.inbox': 'Входящи',
    'nav.assign-tasks': 'Възлагане на задачи',
    'nav.my-tasks': 'Моите задачи',
    'nav.admin-flags': 'Системни настройки',

    // Common UI
    'common.loading': 'Зареждане...',
    'common.error': 'Грешка',
    'common.success': 'Успех',
    'common.cancel': 'Отказ',
    'common.save': 'Запазване',
    'common.delete': 'Изтриване',
    'common.edit': 'Редактиране',
    'common.view': 'Преглед',
    'common.search': 'Търсене',
    'common.filter': 'Филтър',
    'common.clear': 'Изчистване',
    'common.submit': 'Изпращане',
    'common.back': 'Назад',
    'common.next': 'Напред',
    'common.previous': 'Предишен',
    'common.close': 'Затваряне',
    'common.refresh': 'Обновяване',

    // Login Page
    'login.title': 'Вход в градските услуги',
    'login.email': 'Имейл',
    'login.password': 'Парола',
    'login.submit': 'Вход',
    'login.register-link': 'Създаване на акаунт',
    'login.demo-accounts': 'Демо акаунти - Кликнете за попълване:',
    'login.demo-info': 'Всички демо акаунти използват парола:',
    'login.loading': 'Влизане...',

    // Demo Account Roles
    'demo.citizen': 'Гражданин',
    'demo.citizen.desc': 'Подаване и проследяване на заявки за услуги',
    'demo.clerk': 'Служител',
    'demo.clerk.desc': 'Обработка и управление на заявки',
    'demo.supervisor': 'Супервайзор',
    'demo.supervisor.desc': 'Възлагане на задачи и надзор на работния процес',
    'demo.field-agent': 'Полеви агент',
    'demo.field-agent.desc': 'Изпълнение на полеви работи и актуализиране на статуса',
    'demo.admin': 'Администратор',
    'demo.admin.desc': 'Системна конфигурация и функционални флагове',

    // Request Form
    'request.title': 'Заглавие на заявката',
    'request.description': 'Подробно описание',
    'request.category': 'Категория',
    'request.priority': 'Приоритет',
    'request.date': 'Дата на заявката',
    'request.street-address': 'Адрес',
    'request.city': 'Град',
    'request.postal-code': 'Пощенски код',
    'request.location-details': 'Допълнителни детайли за местоположението',
    'request.contact-method': 'Предпочитан метод за контакт',
    'request.affected-services': 'Засегнати услуги',
    'request.emergency': 'Това спешен случай ли е?',
    'request.terms': 'Съгласявам се с условията и потвърждавам, че предоставената информация е вярна',

    // Request Categories
    'category.roads-transportation': 'Пътища и транспорт',
    'category.street-lighting': 'Улично осветление',
    'category.waste-management': 'Управление на отпадъци',
    'category.water-sewer': 'Вода и канализация',
    'category.parks-recreation': 'Паркове и отдих',
    'category.public-safety': 'Обществена безопасност',
    'category.building-permits': 'Строителни разрешения',
    'category.snow-removal': 'Снегопочистване',
    'category.traffic-signals': 'Светофари',
    'category.sidewalk-maintenance': 'Поддръжка на тротоари',
    'category.tree-services': 'Услуги за дървета',
    'category.noise-complaints': 'Оплаквания за шум',
    'category.animal-control': 'Контрол на животни',
    'category.other': 'Други',

    // Request Status
    'status.submitted': 'Подадена',
    'status.triaged': 'Приоритизирана',
    'status.in-progress': 'В ход',
    'status.waiting-on-citizen': 'Чакаме гражданин',
    'status.resolved': 'Решена',
    'status.closed': 'Затворена',
    'status.rejected': 'Отхвърлена',

    // Priority Levels
    'priority.low': 'Нисък',
    'priority.medium': 'Среден',
    'priority.high': 'Висок',
    'priority.urgent': 'Спешен',

    // Contact Methods
    'contact.email': 'Имейл',
    'contact.phone': 'Телефон',
    'contact.sms': 'СМС',
    'contact.mail': 'Поща',

    // Profile Page
    'profile.title': 'Редактиране на профил',
    'profile.personal-info': 'Лична информация',
    'profile.first-name': 'Име',
    'profile.last-name': 'Фамилия',
    'profile.phone': 'Телефонен номер',
    'profile.alternate-phone': 'Алтернативен телефон (По избор)',
    'profile.address': 'Адрес',
    'profile.state': 'Област/Щат',
    'profile.country': 'Държава',
    'profile.preferences': 'Предпочитания',
    'profile.email-notifications': 'Имейл известия',
    'profile.sms-notifications': 'СМС известия',
    'profile.service-updates': 'Актуализации за услугите',
    'profile.marketing-emails': 'Маркетингови имейли',
    'profile.change-password': 'Смяна на парола',
    'profile.current-password': 'Текуща парола',
    'profile.new-password': 'Нова парола',
    'profile.confirm-password': 'Потвърждаване на новата парола',
    'profile.password-strength': 'Сила на паролата:',
    'profile.security-tips': 'Съвети за сигурност',

    // Ranklist Page
    'ranklist.title': 'Класация на общността',
    'ranklist.subtitle': 'Признаване на граждани, които допринасят най-ефективно за подобряването на общността',
    'ranklist.top-contributors': 'Топ допринасящи',
    'ranklist.total-users': 'Активни граждани',
    'ranklist.total-approved': 'Одобрени заявки',
    'ranklist.avg-approval-rate': 'Среден процент одобрение',
    'ranklist.top-performer-growth': 'Растеж на топ изпълнител',
    'ranklist.timeframe': 'Времеви период',
    'ranklist.all-time': 'За всичко време',
    'ranklist.this-year': 'Тази година',
    'ranklist.this-month': 'Този месец',
    'ranklist.how-rankings-work': 'Как работят класациите',

    // Resolved Cases Page
    'resolved.title': 'Решени случаи',
    'resolved.subtitle': 'Проследяване на завършени заявки за градски услуги и техните резултати',
    'resolved.total-resolved': 'Общо решени',
    'resolved.avg-resolution-time': 'Средно време за решаване',
    'resolved.satisfaction-rate': 'Ниво на удовлетвореност',
    'resolved.monthly-improvement': 'Месечно подобрение',
    'resolved.filters': 'Филтри',
    'resolved.clear-filters': 'Изчистване на всички',
    'resolved.search-cases': 'Търсене на случаи',
    'resolved.all-categories': 'Всички категории',
    'resolved.all-priorities': 'Всички приоритети',
    'resolved.from-date': 'От дата',
    'resolved.to-date': 'До дата',
    'resolved.min-rating': 'Мин. рейтинг',

    // Comments and Feedback
    'comments.add': 'Добавяне на коментар',
    'comments.submit': 'Изпращане на коментар',
    'comments.cancel': 'Отказ',
    'comments.public': 'Публичен коментар',
    'comments.private': 'Частен коментар',
    'comments.public-desc': 'Всички могат да видят този коментар',
    'comments.private-desc': 'Само служителите могат да видят този коментар',
    'comments.placeholder': 'Споделете вашите мисли за тази заявка... (минимум 10 символа)',
    'comments.no-comments': 'Все още няма коментари. Бъдете първите, които да споделят мислите си!',

    // Upvotes
    'upvotes.button': 'Подкрепям',
    'upvotes.button-plural': 'Подкрепяния',
    'upvotes.tooltip-own': 'Не можете да подкрепяте собствената си заявка',
    'upvotes.tooltip-add': 'Подкрепете тази заявка',
    'upvotes.tooltip-remove': 'Премахнете подкрепянето',

    // Edit Request
    'edit.locked': 'Редактирането е заключено',
    'edit.time-expired': 'Редактирането е позволено само в рамките на 10 минути от подаването. Тази заявка е създадена преди {minutes} минути.',
    'edit.time-remaining': 'Можете да редактирате тази заявка още {minutes} минути.',
    'edit.own-only': 'Можете да редактирате само собствените си заявки',

    // Image Upload
    'image.upload-title': 'Качване на изображения',
    'image.drag-drop': 'Плъзнете и пуснете изображения или кликнете за избор',
    'image.drop-here': 'Пуснете изображенията тук',
    'image.max-size': 'Поддържа JPEG и PNG файлове до {size}MB всеки',
    'image.max-images': 'Максимум {count} изображения позволени',
    'image.uploaded-count': 'Качени изображения ({count}/{max})',
    'image.delete-confirm': 'Изтриване на изображение',

    // Validation Messages
    'validation.required': '{field} е задължително',
    'validation.email-invalid': 'Моля, въведете валиден имейл адрес',
    'validation.password-weak': 'Паролата трябва да съдържа: главна буква, малка буква, цифра и специален символ',
    'validation.passwords-mismatch': 'Паролите не съвпадат',
    'validation.min-length': '{field} трябва да бъде поне {length} символа',
    'validation.max-length': '{field} трябва да бъде по-малко от {length} символа',
    'validation.date-past': 'Датата не може да бъде повече от 1 месец в миналото',
    'validation.date-future': 'Датата не може да бъде в бъдещето',
    'validation.phone-invalid': 'Моля, въведете валиден телефонен номер',
    'validation.postal-code-invalid': 'Моля, въведете валиден пощенски код',
    'validation.xss-detected': 'Съдържанието съдържа потенциално вредни елементи',
  },

  ES: {
    // Navigation
    'nav.dashboard': 'Panel',
    'nav.requests': 'Mis Solicitudes',
    'nav.new-request': 'Nueva Solicitud',
    'nav.resolved-cases': 'Casos Resueltos',
    'nav.ranklist': 'Clasificación Comunitaria',
    'nav.profile': 'Perfil',
    'nav.logout': 'Cerrar Sesión',
    'nav.login': 'Iniciar Sesión',
    'nav.register': 'Registrarse',
    'nav.inbox': 'Bandeja de Entrada',
    'nav.assign-tasks': 'Asignar Tareas',
    'nav.my-tasks': 'Mis Tareas',
    'nav.admin-flags': 'Configuración del Sistema',

    // Common UI
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.view': 'Ver',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.clear': 'Limpiar',
    'common.submit': 'Enviar',
    'common.back': 'Atrás',
    'common.next': 'Siguiente',
    'common.previous': 'Anterior',
    'common.close': 'Cerrar',
    'common.refresh': 'Actualizar',

    // Login Page
    'login.title': 'Inicio de Sesión - Servicios Municipales',
    'login.email': 'Correo Electrónico',
    'login.password': 'Contraseña',
    'login.submit': 'Iniciar Sesión',
    'login.register-link': 'Crear Cuenta',
    'login.demo-accounts': 'Cuentas Demo - Haga clic para prellenar:',
    'login.demo-info': 'Todas las cuentas demo usan contraseña:',
    'login.loading': 'Iniciando sesión...',

    // Priority Levels
    'priority.low': 'Baja',
    'priority.medium': 'Media',
    'priority.high': 'Alta',
    'priority.urgent': 'Urgente',

    // Request Status
    'status.submitted': 'Enviada',
    'status.triaged': 'Priorizada',
    'status.in-progress': 'En Progreso',
    'status.waiting-on-citizen': 'Esperando al Ciudadano',
    'status.resolved': 'Resuelta',
    'status.closed': 'Cerrada',
    'status.rejected': 'Rechazada',
  },

  FR: {
    // Navigation
    'nav.dashboard': 'Tableau de Bord',
    'nav.requests': 'Mes Demandes',
    'nav.new-request': 'Nouvelle Demande',
    'nav.resolved-cases': 'Cas Résolus',
    'nav.ranklist': 'Classement Communautaire',
    'nav.profile': 'Profil',
    'nav.logout': 'Déconnexion',
    'nav.login': 'Connexion',
    'nav.register': 'S\'inscrire',
    'nav.inbox': 'Boîte de Réception',
    'nav.assign-tasks': 'Assigner des Tâches',
    'nav.my-tasks': 'Mes Tâches',
    'nav.admin-flags': 'Configuration du Système',

    // Common UI
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.cancel': 'Annuler',
    'common.save': 'Sauvegarder',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.view': 'Voir',
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.clear': 'Effacer',
    'common.submit': 'Soumettre',
    'common.back': 'Retour',
    'common.next': 'Suivant',
    'common.previous': 'Précédent',
    'common.close': 'Fermer',
    'common.refresh': 'Actualiser',

    // Login Page
    'login.title': 'Connexion - Services Municipaux',
    'login.email': 'Adresse E-mail',
    'login.password': 'Mot de Passe',
    'login.submit': 'Se Connecter',
    'login.register-link': 'Créer un Compte',
    'login.demo-accounts': 'Comptes Démo - Cliquez pour préremplir:',
    'login.demo-info': 'Tous les comptes démo utilisent le mot de passe:',
    'login.loading': 'Connexion en cours...',

    // Priority Levels
    'priority.low': 'Faible',
    'priority.medium': 'Moyenne',
    'priority.high': 'Élevée',
    'priority.urgent': 'Urgente',

    // Request Status
    'status.submitted': 'Soumise',
    'status.triaged': 'Priorisée',
    'status.in-progress': 'En Cours',
    'status.waiting-on-citizen': 'En Attente du Citoyen',
    'status.resolved': 'Résolue',
    'status.closed': 'Fermée',
    'status.rejected': 'Rejetée',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('EN');

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('cityServices.language') as Language;
    if (savedLanguage && (savedLanguage === 'EN' || savedLanguage === 'BG' || savedLanguage === 'ES' || savedLanguage === 'FR')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('cityServices.language', newLanguage);
  };

  const t = (key: string, variables?: Record<string, string | number>): string => {
    let translation = translations[language][key as keyof typeof translations[typeof language]] || key;
    
    // Handle variable substitution
    if (variables && typeof translation === 'string') {
      Object.entries(variables).forEach(([varKey, value]) => {
        translation = translation.replace(`{${varKey}}`, String(value));
      });
    }
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};