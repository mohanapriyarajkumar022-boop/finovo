import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Enhanced language translations with all languages
const translations = {
  en: {
    // Common
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    pleaseWait: 'Please wait while we load your content',
    verifyingSession: 'Verifying your session...',
    checkingAuthentication: 'Checking authentication...',
    somethingWentWrong: 'Something went wrong',
    tryAgain: 'Try Again',
    reloadPage: 'Reload Page',
    goToHome: 'Go to Home',
    unableToRecover: 'Unable to Recover',
    maxRetriesReached: 'We\'ve tried multiple times but encountered an error.',
    unexpectedError: 'We encountered an unexpected error.',
    attemptsLeft: 'attempts left',
    pageNotFound: 'Page Not Found',
    pageDoesNotExist: 'The page',
    doesntExist: 'doesn\'t exist.',
    suggestedPages: 'Suggested Pages',
    goBack: 'Go Back',
    goToDashboard: 'Go to Dashboard',
    dashboard: 'Dashboard',
    income: 'Income',
    expenditure: 'Expenditure',
    projects: 'Projects',
    overview: 'Overview',
    earnings: 'Earnings',
    spending: 'Spending',
    manageProjects: 'Manage Projects',
    page: 'Page',
    
    // Settings
    settings: 'Settings',
    settingsDescription: 'Manage your account preferences and app behavior',
    profile: 'Profile',
    account: 'Account',
    theme: 'Theme',
    notifications: 'Notifications',
    privacy: 'Privacy',
    appearance: 'Appearance',
    language: 'Language',
    performance: 'Performance',
    accessibility: 'Accessibility',
    about: 'About',
    
    // Profile Section
    profileSettings: 'Profile Settings',
    updateProfilePicture: 'Update your profile picture and view your information',
    displayName: 'Display Name',
    emailAddress: 'Email Address',
    phoneNumber: 'Phone Number',
    bio: 'Bio',
    saveProfile: 'Save Profile',
    yourName: 'Your Name',
    user: 'User',
    enterDisplayName: 'Enter your display name',
    readOnly: 'Read Only',
    emailCannotChange: 'Email cannot be changed here. Contact support to update.',
    tellAboutYourself: 'Tell us about yourself...',
    clickToUpload: 'Click on the camera icon to upload a new photo',
    
    // Language & Region
    languageRegion: 'Language & Region',
    setLanguagePreferences: 'Set your language and regional preferences',
    appLanguage: 'Language',
    currency: 'Currency',
    timezone: 'Timezone',
    languagePreview: 'Language Preview',
    currentLanguage: 'Current language',
    languageDescription: 'Choose your preferred language',
    languageChangesImmediate: 'Language changes will be applied immediately across the entire app',
    currencyChangesImmediate: 'Currency changes will be applied immediately across the entire app',
    timezoneChangesImmediate: 'Timezone changes will be applied immediately across the entire app',
    themeChangesImmediate: 'Theme changes will be applied immediately across the entire app',
    currentCurrency: 'Current currency',
    currentTimezone: 'Current timezone',
    textDirection: 'Text direction',
    saveLanguage: 'Save Language',
    
    // Theme
    themeSettings: 'Theme Settings',
    customizeAppearance: 'Customize your app appearance',
    themeMode: 'Theme Mode',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    autoSystem: 'Auto (System)',
    primaryColor: 'Primary Color',
    fontSize: 'Font Size',
    fontFamily: 'Font Family',
    light: 'Light',
    dark: 'Dark',
    auto: 'Auto',
    saveTheme: 'Save Theme',
    
    // Status Messages
    noSettingsToSave: 'No settings to save',
    settingsSaved: 'Settings saved successfully!',
    saveFailed: 'Failed to save',
    languageChanged: 'Language changed to',
    languageChangeFailed: 'Failed to change language',
    languageChangeError: 'Error changing language',
    currencyChanged: 'Currency changed to',
    currencyChangeFailed: 'Failed to change currency',
    currencyChangeError: 'Error changing currency',
    timezoneChanged: 'Timezone changed to',
    timezoneChangeFailed: 'Failed to change timezone',
    timezoneChangeError: 'Error changing timezone',
    themeChanged: 'Theme changed to',
    themeChangeFailed: 'Failed to change theme',
    themeChangeError: 'Error changing theme',
    imageSizeError: 'Image size should be less than 5MB',
    passwordsNotMatch: 'Passwords do not match',
    passwordMinLength: 'Password must be at least 6 characters',
    passwordChanged: 'Password changed successfully!',
    passwordChangeError: 'Error changing password',
    signedOut: 'Successfully signed out!',
    signoutError: 'Error during signout',
    resetConfirm: 'Are you sure you want to reset all settings to default? This cannot be undone.',
    settingsReset: 'Settings reset successfully!',
    resetError: 'Error resetting settings',
    dataExported: 'Data exported successfully!',
    exportError: 'Error exporting data',
    loadSettingsFailed: 'Failed to Load Settings',
    loadingSettings: 'Loading your settings...',
    
    // About
    aboutFinovo: 'About Finovo',
    appInformation: 'App information and data management',
    version: 'Version',
    lastUpdated: 'Last Updated',
    license: 'License',
    support: 'Support',
    exportData: 'Export Data',
    resetSettings: 'Reset All Settings',
    signOut: 'Sign Out',
    tenantId: 'Tenant ID',
    
    // Modal
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm New Password',
    enterCurrentPassword: 'Enter current password',
    enterNewPassword: 'Enter new password (min 6 characters)',
    confirmNewPassword: 'Confirm new password',
    changing: 'Changing...',
    confirmSignOut: 'Are you sure you want to sign out?',
    signOutWarning: 'You will need to sign in again to access your account.',
    unsavedChangesLost: 'All unsaved changes will be lost',
    redirectToLogin: 'You\'ll be redirected to the login page',
    sessionDataCleared: 'Your session data will be cleared',
    yesSignOut: 'Yes, Sign Out',
    applying: 'Applying...',
    saving: 'Saving...',
    signingOut: 'Signing Out...'
  },
  hi: {
    // Common
    save: 'सेव करें',
    cancel: 'रद्द करें',
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफलता',
    pleaseWait: 'कृपया प्रतीक्षा करें, हम आपकी सामग्री लोड कर रहे हैं',
    verifyingSession: 'आपका सत्र सत्यापित किया जा रहा है...',
    checkingAuthentication: 'प्रमाणीकरण जांचा जा रहा है...',
    somethingWentWrong: 'कुछ गलत हो गया',
    tryAgain: 'पुनः प्रयास करें',
    reloadPage: 'पृष्ठ पुनः लोड करें',
    goToHome: 'होम पर जाएं',
    pageNotFound: 'पृष्ठ नहीं मिला',
    goBack: 'वापस जाएं',
    goToDashboard: 'डैशबोर्ड पर जाएं',
    dashboard: 'डैशबोर्ड',
    income: 'आय',
    expenditure: 'व्यय',
    projects: 'प्रोजेक्ट्स',
    
    // Settings
    settings: 'सेटिंग्स',
    settingsDescription: 'अपनी खाता प्राथमिकताएं और ऐप व्यवहार प्रबंधित करें',
    profile: 'प्रोफाइल',
    account: 'खाता',
    theme: 'थीम',
    notifications: 'सूचनाएं',
    privacy: 'गोपनीयता',
    appearance: 'दिखावट',
    language: 'भाषा',
    performance: 'प्रदर्शन',
    accessibility: 'एक्सेसिबिलिटी',
    about: 'के बारे में',
    
    // Profile Section
    profileSettings: 'प्रोफाइल सेटिंग्स',
    updateProfilePicture: 'अपनी प्रोफाइल तस्वीर अपडेट करें और अपनी जानकारी देखें',
    displayName: 'प्रदर्शन नाम',
    emailAddress: 'ईमेल पता',
    phoneNumber: 'फोन नंबर',
    bio: 'बायो',
    saveProfile: 'प्रोफाइल सेव करें',
    user: 'उपयोगकर्ता',
    enterDisplayName: 'अपना प्रदर्शन नाम दर्ज करें',
    readOnly: 'केवल पढ़ने के लिए',
    emailCannotChange: 'ईमेल यहां नहीं बदला जा सकता। अपडेट करने के लिए सपोर्ट से संपर्क करें।',
    tellAboutYourself: 'हमें अपने बारे में बताएं...',
    clickToUpload: 'नई फोटो अपलोड करने के लिए कैमरा आइकन पर क्लिक करें',
    
    // Language & Region
    languageRegion: 'भाषा और क्षेत्र',
    setLanguagePreferences: 'अपनी भाषा और क्षेत्रीय प्राथमिकताएं सेट करें',
    appLanguage: 'भाषा',
    currency: 'मुद्रा',
    timezone: 'समय क्षेत्र',
    languagePreview: 'भाषा पूर्वावलोकन',
    currentLanguage: 'वर्तमान भाषा',
    languageDescription: 'अपनी पसंदीदा भाषा चुनें',
    languageChangesImmediate: 'भाषा परिवर्तन तुरंत पूरे ऐप में लागू हो जाएगा',
    currencyChangesImmediate: 'मुद्रा परिवर्तन तुरंत पूरे ऐप में लागू हो जाएगा',
    timezoneChangesImmediate: 'समय क्षेत्र परिवर्तन तुरंत पूरे ऐप में लागू हो जाएगा',
    themeChangesImmediate: 'थीम परिवर्तन तुरंत पूरे ऐप में लागू हो जाएगा',
    currentCurrency: 'वर्तमान मुद्रा',
    currentTimezone: 'वर्तमान समय क्षेत्र',
    textDirection: 'टेक्स्ट दिशा',
    saveLanguage: 'भाषा सेव करें',
    
    // Theme
    themeSettings: 'थीम सेटिंग्स',
    customizeAppearance: 'अपने ऐप की उपस्थिति अनुकूलित करें',
    themeMode: 'थीम मोड',
    lightMode: 'लाइट मोड',
    darkMode: 'डार्क मोड',
    autoSystem: 'ऑटो (सिस्टम)',
    primaryColor: 'प्राथमिक रंग',
    fontSize: 'फ़ॉन्ट आकार',
    fontFamily: 'फ़ॉन्ट परिवार',
    light: 'लाइट',
    dark: 'डार्क',
    auto: 'ऑटो',
    saveTheme: 'थीम सेव करें',
    
    // Status Messages
    noSettingsToSave: 'सेव करने के लिए कोई सेटिंग्स नहीं',
    settingsSaved: 'सेटिंग्स सफलतापूर्वक सेव हो गई!',
    saveFailed: 'सेव करने में विफल',
    languageChanged: 'भाषा बदल गई',
    languageChangeFailed: 'भाषा बदलने में विफल',
    languageChangeError: 'भाषा बदलने में त्रुटि',
    currencyChanged: 'मुद्रा बदल गई',
    currencyChangeFailed: 'मुद्रा बदलने में विफल',
    currencyChangeError: 'मुद्रा बदलने में त्रुटि',
    timezoneChanged: 'समय क्षेत्र बदल गया',
    timezoneChangeFailed: 'समय क्षेत्र बदलने में विफल',
    timezoneChangeError: 'समय क्षेत्र बदलने में त्रुटि',
    themeChanged: 'थीम बदल गई',
    themeChangeFailed: 'थीम बदलने में विफल',
    themeChangeError: 'थीम बदलने में त्रुटि',
    imageSizeError: 'छवि का आकार 5MB से कम होना चाहिए',
    passwordsNotMatch: 'पासवर्ड मेल नहीं खाते',
    passwordMinLength: 'पासवर्ड कम से कम 6 वर्णों का होना चाहिए',
    passwordChanged: 'पासवर्ड सफलतापूर्वक बदल गया!',
    passwordChangeError: 'पासवर्ड बदलने में त्रुटि',
    signedOut: 'सफलतापूर्वक साइन आउट हो गए!',
    signoutError: 'साइन आउट के दौरान त्रुटि',
    resetConfirm: 'क्या आप वाकई सभी सेटिंग्स को डिफ़ॉल्ट पर रीसेट करना चाहते हैं? इसे पूर्ववत नहीं किया जा सकता।',
    settingsReset: 'सेटिंग्स सफलतापूर्वक रीसेट हो गई!',
    resetError: 'सेटिंग्स रीसेट करने में त्रुटि',
    dataExported: 'डेटा सफलतापूर्वक एक्सपोर्ट हो गया!',
    exportError: 'डेटा एक्सपोर्ट करने में त्रुटि',
    loadSettingsFailed: 'सेटिंग्स लोड करने में विफल',
    loadingSettings: 'आपकी सेटिंग्स लोड हो रही हैं...',
    
    // About
    aboutFinovo: 'फिनोवो के बारे में',
    appInformation: 'ऐप जानकारी और डेटा प्रबंधन',
    version: 'संस्करण',
    lastUpdated: 'अंतिम अपडेट',
    license: 'लाइसेंस',
    support: 'सहायता',
    exportData: 'डेटा एक्सपोर्ट करें',
    resetSettings: 'सभी सेटिंग्स रीसेट करें',
    signOut: 'साइन आउट',
    tenantId: 'टेनेंट आईडी',
    
    // Modal
    changePassword: 'पासवर्ड बदलें',
    currentPassword: 'वर्तमान पासवर्ड',
    newPassword: 'नया पासवर्ड',
    confirmPassword: 'नया पासवर्ड पुष्टि करें',
    enterCurrentPassword: 'वर्तमान पासवर्ड दर्ज करें',
    enterNewPassword: 'नया पासवर्ड दर्ज करें (न्यूनतम 6 वर्ण)',
    confirmNewPassword: 'नया पासवर्ड पुष्टि करें',
    changing: 'बदला जा रहा है...',
    confirmSignOut: 'क्या आप वाकई साइन आउट करना चाहते हैं?',
    signOutWarning: 'अपने खाते तक पहुंचने के लिए आपको फिर से साइन इन करना होगा।',
    unsavedChangesLost: 'सभी अनसेव किए गए परिवर्तन खो जाएंगे',
    redirectToLogin: 'आपको लॉगिन पेज पर रीडायरेक्ट किया जाएगा',
    sessionDataCleared: 'आपका सत्र डेटा साफ हो जाएगा',
    yesSignOut: 'हां, साइन आउट करें',
    applying: 'लागू किया जा रहा है...',
    saving: 'सेव हो रहा है...',
    signingOut: 'साइन आउट हो रहा है...'
  },
  es: {
    // Common
    save: 'Guardar',
    cancel: 'Cancelar',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    pleaseWait: 'Por favor espera mientras cargamos tu contenido',
    verifyingSession: 'Verificando tu sesión...',
    checkingAuthentication: 'Verificando autenticación...',
    somethingWentWrong: 'Algo salió mal',
    tryAgain: 'Intentar de nuevo',
    reloadPage: 'Recargar página',
    goToHome: 'Ir al Inicio',
    pageNotFound: 'Página No Encontrada',
    goBack: 'Regresar',
    goToDashboard: 'Ir al Panel',
    dashboard: 'Panel',
    income: 'Ingresos',
    expenditure: 'Gastos',
    projects: 'Proyectos',
    
    // Settings
    settings: 'Configuración',
    settingsDescription: 'Gestiona tus preferencias de cuenta y comportamiento de la aplicación',
    profile: 'Perfil',
    account: 'Cuenta',
    theme: 'Tema',
    notifications: 'Notificaciones',
    privacy: 'Privacidad',
    appearance: 'Apariencia',
    language: 'Idioma',
    performance: 'Rendimiento',
    accessibility: 'Accesibilidad',
    about: 'Acerca de',
    
    // Profile Section
    profileSettings: 'Configuración de Perfil',
    updateProfilePicture: 'Actualiza tu foto de perfil y ve tu información',
    displayName: 'Nombre para mostrar',
    emailAddress: 'Correo electrónico',
    phoneNumber: 'Número de teléfono',
    bio: 'Biografía',
    saveProfile: 'Guardar Perfil',
    user: 'Usuario',
    enterDisplayName: 'Ingresa tu nombre para mostrar',
    readOnly: 'Solo lectura',
    emailCannotChange: 'El correo electrónico no se puede cambiar aquí. Contacta al soporte para actualizar.',
    tellAboutYourself: 'Cuéntanos sobre ti...',
    clickToUpload: 'Haz clic en el icono de la cámara para subir una nueva foto',
    
    // Language & Region
    languageRegion: 'Idioma y Región',
    setLanguagePreferences: 'Establece tus preferencias de idioma y región',
    appLanguage: 'Idioma',
    currency: 'Moneda',
    timezone: 'Zona horaria',
    languagePreview: 'Vista previa del idioma',
    currentLanguage: 'Idioma actual',
    languageDescription: 'Elige tu idioma preferido',
    languageChangesImmediate: 'Los cambios de idioma se aplicarán inmediatamente en toda la aplicación',
    currencyChangesImmediate: 'Los cambios de moneda se aplicarán inmediatamente en toda la aplicación',
    timezoneChangesImmediate: 'Los cambios de zona horaria se aplicarán inmediatamente en toda la aplicación',
    themeChangesImmediate: 'Los cambios de tema se aplicarán inmediatamente en toda la aplicación',
    currentCurrency: 'Moneda actual',
    currentTimezone: 'Zona horaria actual',
    textDirection: 'Dirección del texto',
    saveLanguage: 'Guardar Idioma',
    
    // Status Messages
    noSettingsToSave: 'No hay configuraciones para guardar',
    settingsSaved: '¡Configuraciones guardadas exitosamente!',
    saveFailed: 'Error al guardar',
    languageChanged: 'Idioma cambiado a',
    languageChangeFailed: 'Error al cambiar el idioma',
    languageChangeError: 'Error al cambiar el idioma',
    currencyChanged: 'Moneda cambiada a',
    currencyChangeFailed: 'Error al cambiar la moneda',
    currencyChangeError: 'Error al cambiar la moneda',
    timezoneChanged: 'Zona horaria cambiada a',
    timezoneChangeFailed: 'Error al cambiar la zona horaria',
    timezoneChangeError: 'Error al cambiar la zona horaria',
    themeChanged: 'Tema cambiado a',
    themeChangeFailed: 'Error al cambiar el tema',
    themeChangeError: 'Error al cambiar el tema',
    imageSizeError: 'El tamaño de la imagen debe ser menor a 5MB',
    passwordsNotMatch: 'Las contraseñas no coinciden',
    passwordMinLength: 'La contraseña debe tener al menos 6 caracteres',
    passwordChanged: '¡Contraseña cambiada exitosamente!',
    passwordChangeError: 'Error al cambiar la contraseña',
    signedOut: '¡Sesión cerrada exitosamente!',
    signoutError: 'Error durante el cierre de sesión',
    resetConfirm: '¿Estás seguro de que quieres restablecer todas las configuraciones a los valores predeterminados? Esto no se puede deshacer.',
    settingsReset: '¡Configuraciones restablecidas exitosamente!',
    resetError: 'Error al restablecer configuraciones',
    dataExported: '¡Datos exportados exitosamente!',
    exportError: 'Error al exportar datos',
    loadSettingsFailed: 'Error al cargar configuraciones',
    loadingSettings: 'Cargando tus configuraciones...',
    
    // About
    aboutFinovo: 'Acerca de Finovo',
    appInformation: 'Información de la aplicación y gestión de datos',
    version: 'Versión',
    lastUpdated: 'Última actualización',
    license: 'Licencia',
    support: 'Soporte',
    exportData: 'Exportar Datos',
    resetSettings: 'Restablecer Todas las Configuraciones',
    signOut: 'Cerrar Sesión',
    tenantId: 'ID de Inquilino',
    
    // Modal
    changePassword: 'Cambiar Contraseña',
    currentPassword: 'Contraseña Actual',
    newPassword: 'Nueva Contraseña',
    confirmPassword: 'Confirmar Nueva Contraseña',
    enterCurrentPassword: 'Ingresa la contraseña actual',
    enterNewPassword: 'Ingresa nueva contraseña (mínimo 6 caracteres)',
    confirmNewPassword: 'Confirmar nueva contraseña',
    changing: 'Cambiando...',
    confirmSignOut: '¿Estás seguro de que quieres cerrar sesión?',
    signOutWarning: 'Necesitarás iniciar sesión nuevamente para acceder a tu cuenta.',
    unsavedChangesLost: 'Todos los cambios no guardados se perderán',
    redirectToLogin: 'Serás redirigido a la página de inicio de sesión',
    sessionDataCleared: 'Tus datos de sesión serán eliminados',
    yesSignOut: 'Sí, Cerrar Sesión',
    applying: 'Aplicando...',
    saving: 'Guardando...',
    signingOut: 'Cerrando sesión...'
  },
  fr: {
    // Basic translations for French
    settings: 'Paramètres',
    profile: 'Profil',
    account: 'Compte',
    theme: 'Thème',
    notifications: 'Notifications',
    privacy: 'Confidentialité',
    appearance: 'Apparence',
    language: 'Langue',
    performance: 'Performance',
    accessibility: 'Accessibilité',
    about: 'À propos',
    save: 'Sauvegarder',
    cancel: 'Annuler',
    loading: 'Chargement...',
  },
  de: {
    // Basic translations for German
    settings: 'Einstellungen',
    profile: 'Profil',
    account: 'Konto',
    theme: 'Thema',
    notifications: 'Benachrichtigungen',
    privacy: 'Datenschutz',
    appearance: 'Erscheinungsbild',
    language: 'Sprache',
    performance: 'Leistung',
    accessibility: 'Barrierefreiheit',
    about: 'Über',
    save: 'Speichern',
    cancel: 'Abbrechen',
    loading: 'Laden...',
  },
  it: {
    // Basic translations for Italian
    settings: 'Impostazioni',
    profile: 'Profilo',
    account: 'Account',
    theme: 'Tema',
    notifications: 'Notifiche',
    privacy: 'Privacy',
    appearance: 'Aspetto',
    language: 'Lingua',
    performance: 'Prestazioni',
    accessibility: 'Accessibilità',
    about: 'Informazioni',
    save: 'Salva',
    cancel: 'Annulla',
    loading: 'Caricamento...',
  },
  pt: {
    // Basic translations for Portuguese
    settings: 'Configurações',
    profile: 'Perfil',
    account: 'Conta',
    theme: 'Tema',
    notifications: 'Notificações',
    privacy: 'Privacidade',
    appearance: 'Aparência',
    language: 'Idioma',
    performance: 'Desempenho',
    accessibility: 'Acessibilidade',
    about: 'Sobre',
    save: 'Salvar',
    cancel: 'Cancelar',
    loading: 'Carregando...',
  },
  ru: {
    // Basic translations for Russian
    settings: 'Настройки',
    profile: 'Профиль',
    account: 'Аккаунт',
    theme: 'Тема',
    notifications: 'Уведомления',
    privacy: 'Конфиденциальность',
    appearance: 'Внешний вид',
    language: 'Язык',
    performance: 'Производительность',
    accessibility: 'Доступность',
    about: 'О приложении',
    save: 'Сохранить',
    cancel: 'Отмена',
    loading: 'Загрузка...',
  },
  zh: {
    // Basic translations for Chinese
    settings: '设置',
    profile: '个人资料',
    account: '账户',
    theme: '主题',
    notifications: '通知',
    privacy: '隐私',
    appearance: '外观',
    language: '语言',
    performance: '性能',
    accessibility: '无障碍',
    about: '关于',
    save: '保存',
    cancel: '取消',
    loading: '加载中...',
  },
  ja: {
    // Basic translations for Japanese
    settings: '設定',
    profile: 'プロフィール',
    account: 'アカウント',
    theme: 'テーマ',
    notifications: '通知',
    privacy: 'プライバシー',
    appearance: '外観',
    language: '言語',
    performance: 'パフォーマンス',
    accessibility: 'アクセシビリティ',
    about: '約',
    save: '保存',
    cancel: 'キャンセル',
    loading: '読み込み中...',
  },
  ko: {
    // Basic translations for Korean
    settings: '설정',
    profile: '프로필',
    account: '계정',
    theme: '테마',
    notifications: '알림',
    privacy: '개인정보',
    appearance: '외관',
    language: '언어',
    performance: '성능',
    accessibility: '접근성',
    about: '약',
    save: '저장',
    cancel: '취소',
    loading: '로딩 중...',
  },
  ar: {
    // Basic translations for Arabic
    settings: 'الإعدادات',
    profile: 'الملف الشخصي',
    account: 'الحساب',
    theme: 'السمة',
    notifications: 'الإشعارات',
    privacy: 'الخصوصية',
    appearance: 'المظهر',
    language: 'اللغة',
    performance: 'الأداء',
    accessibility: 'إمكانية الوصول',
    about: 'حول',
    save: 'حفظ',
    cancel: 'إلغاء',
    loading: 'جاري التحميل...',
  },
  ta: {
    // Basic translations for Tamil
    settings: 'அமைப்புகள்',
    profile: 'சுயவிவரம்',
    account: 'கணக்கு',
    theme: 'தீம்',
    notifications: 'அறிவிப்புகள்',
    privacy: 'தனியுரிமை',
    appearance: 'தோற்றம்',
    language: 'மொழி',
    performance: 'செயல்திறன்',
    accessibility: 'அணுகல்',
    about: 'பற்றி',
    save: 'சேமிக்கவும்',
    cancel: 'ரத்துசெய்',
    loading: 'லோடிங்...',
  },
  te: {
    // Basic translations for Telugu
    settings: 'సెట్టింగ్స్',
    profile: 'ప్రొఫైల్',
    account: 'ఖాతా',
    theme: 'థీమ్',
    notifications: 'నోటిఫికేషన్స్',
    privacy: 'గోప్యత',
    appearance: 'స్వరూపం',
    language: 'భాష',
    performance: 'పనితీరు',
    accessibility: 'యాక్సెసిబిలిటీ',
    about: 'గురించి',
    save: 'సేవ్ చేయండి',
    cancel: 'రద్దు చేయండి',
    loading: 'లోడ్ అవుతోంది...',
  },
  // Add more basic translations for other languages
  bn: {
    settings: 'সেটিংস',
    profile: 'প্রোফাইল',
    account: 'অ্যাকাউন্ট',
    theme: 'থিম',
    notifications: 'বিজ্ঞপ্তি',
    privacy: 'গোপনীয়তা',
    appearance: 'চেহারা',
    language: 'ভাষা',
    performance: 'কর্মক্ষমতা',
    accessibility: 'অ্যাক্সেসিবিলিটি',
    about: 'সম্পর্কে',
    save: 'সংরক্ষণ করুন',
    cancel: 'বাতিল করুন',
    loading: 'লোড হচ্ছে...',
  },
  pa: {
    settings: 'ਸੈਟਿੰਗਾਂ',
    profile: 'ਪ੍ਰੋਫਾਈਲ',
    account: 'ਖਾਤਾ',
    theme: 'ਥੀਮ',
    notifications: 'ਸੂਚਨਾਵਾਂ',
    privacy: 'ਗੋਪਨੀਯਤਾ',
    appearance: 'ਦਿੱਖ',
    language: 'ਭਾਸ਼ਾ',
    performance: 'ਕਾਰਗੁਜ਼ਾਰੀ',
    accessibility: 'ਪਹੁੰਚ',
    about: 'ਬਾਰੇ',
    save: 'ਸੇਵ ਕਰੋ',
    cancel: 'ਰੱਦ ਕਰੋ',
    loading: 'ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...',
  },
  mr: {
    settings: 'सेटिंग्ज',
    profile: 'प्रोफाइल',
    account: 'खाते',
    theme: 'थीम',
    notifications: 'अधिसूचना',
    privacy: 'गोपनीयता',
    appearance: 'देखावा',
    language: 'भाषा',
    performance: 'कामगिरी',
    accessibility: 'प्रवेशयोग्यता',
    about: 'बद्दल',
    save: 'जतन करा',
    cancel: 'रद्द करा',
    loading: 'लोड होत आहे...',
  },
  tr: {
    settings: 'Ayarlar',
    profile: 'Profil',
    account: 'Hesap',
    theme: 'Tema',
    notifications: 'Bildirimler',
    privacy: 'Gizlilik',
    appearance: 'Görünüm',
    language: 'Dil',
    performance: 'Performans',
    accessibility: 'Erişilebilirlik',
    about: 'Hakkında',
    save: 'Kaydet',
    cancel: 'İptal',
    loading: 'Yükleniyor...',
  },
  vi: {
    settings: 'Cài đặt',
    profile: 'Hồ sơ',
    account: 'Tài khoản',
    theme: 'Chủ đề',
    notifications: 'Thông báo',
    privacy: 'Quyền riêng tư',
    appearance: 'Giao diện',
    language: 'Ngôn ngữ',
    performance: 'Hiệu suất',
    accessibility: 'Khả năng tiếp cận',
    about: 'Giới thiệu',
    save: 'Lưu',
    cancel: 'Hủy',
    loading: 'Đang tải...',
  },
  pl: {
    settings: 'Ustawienia',
    profile: 'Profil',
    account: 'Konto',
    theme: 'Motyw',
    notifications: 'Powiadomienia',
    privacy: 'Prywatność',
    appearance: 'Wygląd',
    language: 'Język',
    performance: 'Wydajność',
    accessibility: 'Dostępność',
    about: 'O aplikacji',
    save: 'Zapisz',
    cancel: 'Anuluj',
    loading: 'Ładowanie...',
  },
  nl: {
    settings: 'Instellingen',
    profile: 'Profiel',
    account: 'Account',
    theme: 'Thema',
    notifications: 'Meldingen',
    privacy: 'Privacy',
    appearance: 'Uiterlijk',
    language: 'Taal',
    performance: 'Prestaties',
    accessibility: 'Toegankelijkheid',
    about: 'Over',
    save: 'Opslaan',
    cancel: 'Annuleren',
    loading: 'Laden...',
  },
  sv: {
    settings: 'Inställningar',
    profile: 'Profil',
    account: 'Konto',
    theme: 'Tema',
    notifications: 'Aviseringar',
    privacy: 'Integritet',
    appearance: 'Utseende',
    language: 'Språk',
    performance: 'Prestanda',
    accessibility: 'Tillgänglighet',
    about: 'Om',
    save: 'Spara',
    cancel: 'Avbryt',
    loading: 'Laddar...',
  },
  no: {
    settings: 'Innstillinger',
    profile: 'Profil',
    account: 'Konto',
    theme: 'Tema',
    notifications: 'Varsler',
    privacy: 'Personvern',
    appearance: 'Utseende',
    language: 'Språk',
    performance: 'Ytelse',
    accessibility: 'Tilgjengeligheit',
    about: 'Om',
    save: 'Lagre',
    cancel: 'Avbryt',
    loading: 'Laster...',
  },
  da: {
    settings: 'Indstillinger',
    profile: 'Profil',
    account: 'Konto',
    theme: 'Tema',
    notifications: 'Meddelelser',
    privacy: 'Privatliv',
    appearance: 'Udseende',
    language: 'Sprog',
    performance: 'Ydeevne',
    accessibility: 'Tilgængelighed',
    about: 'Om',
    save: 'Gem',
    cancel: 'Annuller',
    loading: 'Indlæser...',
  },
  fi: {
    settings: 'Asetukset',
    profile: 'Profiili',
    account: 'Tili',
    theme: 'Teema',
    notifications: 'Ilmoitukset',
    privacy: 'Yksityisyys',
    appearance: 'Ulkonäkö',
    language: 'Kieli',
    performance: 'Suorituskyky',
    accessibility: 'Saavutettavuus',
    about: 'Tietoja',
    save: 'Tallenna',
    cancel: 'Peruuta',
    loading: 'Ladataan...',
  },
  el: {
    settings: 'Ρυθμίσεις',
    profile: 'Προφίλ',
    account: 'Λογαριασμός',
    theme: 'Θέμα',
    notifications: 'Ειδοποιήσεις',
    privacy: 'Απόρρητο',
    appearance: 'Εμφάνιση',
    language: 'Γλώσσα',
    performance: 'Απόδοση',
    accessibility: 'Προσβασιμότηта',
    about: 'Σχετικά',
    save: 'Αποθήκευση',
    cancel: 'Ακύρωση',
    loading: 'Φόρτωση...',
  },
  he: {
    settings: 'הגדרות',
    profile: 'פרופיל',
    account: 'חשבון',
    theme: 'ערכת נושא',
    notifications: 'התראות',
    privacy: 'פרטיות',
    appearance: 'מראה',
    language: 'שפה',
    performance: 'ביצועים',
    accessibility: 'נגישות',
    about: 'אודות',
    save: 'שמור',
    cancel: 'בטל',
    loading: 'טוען...',
  },
  id: {
    settings: 'Pengaturan',
    profile: 'Profil',
    account: 'Akun',
    theme: 'Tema',
    notifications: 'Notifikasi',
    privacy: 'Privasi',
    appearance: 'Penampilan',
    language: 'Bahasa',
    performance: 'Kinerja',
    accessibility: 'Aksesibilitas',
    about: 'Tentang',
    save: 'Simpan',
    cancel: 'Batal',
    loading: 'Memuat...',
  },
  ms: {
    settings: 'Tetapan',
    profile: 'Profil',
    account: 'Akaun',
    theme: 'Tema',
    notifications: 'Pemberitahuan',
    privacy: 'Privasi',
    appearance: 'Penampilan',
    language: 'Bahasa',
    performance: 'Prestasi',
    accessibility: 'Kebolehcapaian',
    about: 'Mengenai',
    save: 'Simpan',
    cancel: 'Batal',
    loading: 'Memuatkan...',
  },
  th: {
    settings: 'การตั้งค่า',
    profile: 'โปรไฟล์',
    account: 'บัญชี',
    theme: 'ธีม',
    notifications: 'การแจ้งเตือน',
    privacy: 'ความเป็นส่วนตัว',
    appearance: 'ลักษณะที่ปรากฏ',
    language: 'ภาษา',
    performance: 'ประสิทธิภาพ',
    accessibility: 'การเข้าถึง',
    about: 'เกี่ยวกับ',
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    loading: 'กำลังโหลด...',
  },
  uk: {
    settings: 'Налаштування',
    profile: 'Профіль',
    account: 'Обліковий запис',
    theme: 'Тема',
    notifications: 'Сповіщення',
    privacy: 'Конфіденційність',
    appearance: 'Зовнішній вигляд',
    language: 'Мова',
    performance: 'Продуктивність',
    accessibility: 'Доступність',
    about: 'Про додаток',
    save: 'Зберегти',
    cancel: 'Скасувати',
    loading: 'Завантаження...',
  },
  cs: {
    settings: 'Nastavení',
    profile: 'Profil',
    account: 'Účet',
    theme: 'Téma',
    notifications: 'Oznámení',
    privacy: 'Soukromí',
    appearance: 'Vzhled',
    language: 'Jazyk',
    performance: 'Výkon',
    accessibility: 'Přístupnost',
    about: 'O aplikaci',
    save: 'Uložit',
    cancel: 'Zrušit',
    loading: 'Načítání...',
  },
  ro: {
    settings: 'Setări',
    profile: 'Profil',
    account: 'Cont',
    theme: 'Temă',
    notifications: 'Notificări',
    privacy: 'Confidențialitate',
    appearance: 'Aspect',
    language: 'Limbă',
    performance: 'Performanță',
    accessibility: 'Accesibilitate',
    about: 'Despre',
    save: 'Salvează',
    cancel: 'Anulează',
    loading: 'Se încarcă...',
  },
  hu: {
    settings: 'Beállítások',
    profile: 'Profil',
    account: 'Fiók',
    theme: 'Téma',
    notifications: 'Értesítések',
    privacy: 'Adatvédelem',
    appearance: 'Megjelenés',
    language: 'Nyelv',
    performance: 'Teljesítmény',
    accessibility: 'Akadálymentesítés',
    about: 'Névjegy',
    save: 'Mentés',
    cancel: 'Mégse',
    loading: 'Betöltés...',
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('appLanguage') || 
                          localStorage.getItem('userLanguage') || 
                          'en';
    
    if (savedLanguage && translations[savedLanguage]) {
      console.log('🌍 Loading saved language:', savedLanguage);
      setCurrentLanguage(savedLanguage);
      applyLanguageToDOM(savedLanguage);
    } else {
      localStorage.setItem('appLanguage', 'en');
      localStorage.setItem('userLanguage', 'en');
      applyLanguageToDOM('en');
    }
  }, []);

  // Apply language to DOM globally
  const applyLanguageToDOM = useCallback((language) => {
    console.log('🌍 Applying language to DOM globally:', language);
    
    // Update document language
    document.documentElement.lang = language;
    
    // Set text direction
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    const direction = rtlLanguages.includes(language) ? 'rtl' : 'ltr';
    document.documentElement.dir = direction;
    document.body.style.direction = direction;
    
    // Store in localStorage
    localStorage.setItem('appLanguage', language);
    localStorage.setItem('userLanguage', language);

    // Dispatch global event
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language, direction } 
    }));

    console.log('✅ Language applied globally:', { language, direction });
  }, []);

  // Enhanced language update function
  const updateLanguage = useCallback(async (newLanguage) => {
    console.log('🔄 Language change requested:', newLanguage);
    
    if (!translations[newLanguage]) {
      console.warn('⚠️ Language not found:', newLanguage);
      newLanguage = 'en';
    }

    if (newLanguage === currentLanguage) {
      console.log('ℹ️ Same language selected');
      return { success: true };
    }

    setIsLoading(true);
    
    try {
      // Apply to DOM
      applyLanguageToDOM(newLanguage);
      
      // Update React state
      setCurrentLanguage(newLanguage);
      
      // Force re-render of entire app
      setForceUpdate(prev => prev + 1);
      
      // Save to backend if authenticated
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (token && userId) {
        try {
          const response = await fetch('http://localhost:5000/api/settings/update-section', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Tenant-ID': userId
            },
            body: JSON.stringify({
              section: 'language',
              settings: {
                appLanguage: newLanguage,
                locale: newLanguage,
                tenantId: userId
              }
            })
          });
          
          if (response.ok) {
            console.log('✅ Language saved to backend');
          }
        } catch (error) {
          console.warn('⚠️ Could not save to backend:', error);
        }
      }
      
      setIsLoading(false);
      console.log('✅ Language change completed');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error changing language:', error);
      setIsLoading(false);
      return { success: false, error: error.message };
    }
  }, [currentLanguage, applyLanguageToDOM]);

  // Translation function with fallback
  const t = useCallback((key) => {
    if (!key) return '';
    
    const keys = key.split('.');
    let value = translations[currentLanguage];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    // Fallback to English
    if (!value && currentLanguage !== 'en') {
      value = keys.reduce((obj, k) => obj?.[k], translations.en);
    }
    
    return value || key;
  }, [currentLanguage, forceUpdate]); // Add forceUpdate to dependency

  const value = {
    language: currentLanguage,
    updateLanguage,
    t,
    isLoading,
    forceUpdate, // Expose forceUpdate for components that need it
    availableLanguages: Object.keys(translations)
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;