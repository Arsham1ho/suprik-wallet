// Translation keys and content for all supported languages

export interface Translations {
  // Landing Page
  landing: {
    title: string;
    subtitle: string;
    getStarted: string;
    signIn: string;
    features: {
      secure: string;
      secureDesc: string;
      easy: string;
      easyDesc: string;
      fast: string;
      fastDesc: string;
    };
  };
  
  // Auth
  auth: {
    signUp: string;
    signIn: string;
    createAccount: string;
    welcome: string;
    welcomeBack: string;
    username: string;
    usernamePlaceholder: string;
    password: string;
    confirmPassword: string;
    seedPhrase: string;
    seedPhrasePlaceholder: string;
    continueWithGoogle: string;
    alreadyHaveAccount: string;
    dontHaveAccount: string;
    createNewWallet: string;
    importExisting: string;
    saveSecurely: string;
    enterSeedPhrase: string;
  };
  
  // Navigation
  nav: {
    home: string;
    swap: string;
    activity: string;
    settings: string;
    chat: string;
    stocks: string;
  };
  
  // Home Page
  home: {
    totalBalance: string;
    send: string;
    receive: string;
    yourAssets: string;
    noAssets: string;
    addToken: string;
  };
  
  // Send & Receive
  sendReceive: {
    send: string;
    receive: string;
    sendTo: string;
    amount: string;
    amountPlaceholder: string;
    recipientAddress: string;
    recipientPlaceholder: string;
    max: string;
    available: string;
    networkFee: string;
    appFee: string;
    total: string;
    confirmSend: string;
    cancel: string;
    yourAddress: string;
    copyAddress: string;
    shareQR: string;
    addressCopied: string;
    selectToken: string;
  };
  
  // Swap
  swap: {
    swap: string;
    from: string;
    to: string;
    youPay: string;
    youReceive: string;
    rate: string;
    slippage: string;
    swapNow: string;
    insufficientBalance: string;
    enterAmount: string;
  };
  
  // Activity
  activity: {
    activity: string;
    transactions: string;
    noTransactions: string;
    sent: string;
    received: string;
    swapped: string;
    pending: string;
    confirmed: string;
    failed: string;
    viewExplorer: string;
    details: string;
    date: string;
    status: string;
    amount: string;
    fee: string;
    signature: string;
  };
  
  // Settings
  settings: {
    settings: string;
    title: string;
    account: string;
    security: string;
    preferences: string;
    about: string;
    inviteFriends: string;
    logout: string;
    profile: string;
    username: string;
    walletAddress: string;
    connectedAccounts: string;
    manageAccounts: string;

    // Main settings page
    general: string;
    accountSettings: string;
    accountSettingsDesc: string;
    preferencesDesc: string;
    securityDesc: string;
    themeDesc: string;
    developer: string;
    testnetMode: string;
    usingTestNetwork: string;
    enableForTesting: string;
    switchedToMainnet: string;
    switchedToTestnet: string;
    testReceiveTokens: string;
    rpcSettings: string;
    rpcSettingsDesc: string;
    helpSupport: string;
    helpSupportDesc: string;
    inviteFriendsDesc: string;
    aboutDesc: string;
    lockWallet: string;
    signOut: string;
    signedOut: string;

    // Security
    seedPhrase: string;
    showSeedPhrase: string;
    deleteFunds: string;
    deleteWallet: string;
    warning: string;
    securityWarning: string;

    // Preferences
    displayLanguage: string;
    primaryCurrency: string;
    chooseLanguage: string;
    chooseCurrency: string;
    currentSettings: string;
    language: string;
    currency: string;

    // About
    version: string;
    website: string;
    support: string;
    terms: string;
    privacy: string;
  };
  
  // Common
  common: {
    save: string;
    cancel: string;
    confirm: string;
    delete: string;
    edit: string;
    copy: string;
    share: string;
    close: string;
    back: string;
    next: string;
    done: string;
    loading: string;
    error: string;
    success: string;
    warning: string;
    retry: string;
    search: string;
    filter: string;
    sort: string;
    all: string;
    active: string;
    generic: string;
  };
  
  // Messages
  messages: {
    success: {
      transactionSent: string;
      settingsUpdated: string;
      usernameSaved: string;
      copied: string;
    };
    error: {
      insufficientBalance: string;
      invalidAddress: string;
      transactionFailed: string;
      loadingFailed: string;
      saveFailed: string;
      generic: string;
    };
  };
  
  // NFT
  nft: {
    nftGallery: string;
    myCollection: string;
    noNFTs: string;
    noNFTsDesc: string;
    viewDetails: string;
    collection: string;
    floorPrice: string;
    owner: string;
    description: string;
    attributes: string;
    viewOnExplorer: string;
  };
  
  // Theme
  theme: {
    title: string;
    themeCustomization: string;
    chooseTheme: string;
    gradients: string;
    classic: string;
    midnight: string;
    sunset: string;
    forest: string;
    ocean: string;
    aurora: string;
    fire: string;
    neon: string;
    custom: string;
  };
  
  // Address Book
  addressBook: {
    title: string;
    addressBook: string;
    myContacts: string;
    noContacts: string;
    noContactsDesc: string;
    addContact: string;
    editContact: string;
    deleteContact: string;
    contactName: string;
    contactAddress: string;
    network: string;
    save: string;
    delete: string;
    cancel: string;
    recentContacts: string;
  };
  
  // Biometric
  biometric: {
    biometricAuth: string;
    faceID: string;
    fingerprint: string;
    enableBiometric: string;
    disableBiometric: string;
    biometricEnabled: string;
    biometricDisabled: string;
    authenticating: string;
    authSuccess: string;
    authFailed: string;
    unlockWithBiometric: string;
  };
  
  // Auto Lock
  autoLock: {
    autoLock: string;
    lockTimeout: string;
    never: string;
    oneMinute: string;
    fiveMinutes: string;
    fifteenMinutes: string;
    thirtyMinutes: string;
    oneHour: string;
    locked: string;
    unlockWallet: string;
    enterPassword: string;
  };
  
  // Notifications
  notifications: {
    notifications: string;
    noNotifications: string;
    markAllRead: string;
    transactionConfirmed: string;
    transactionFailed: string;
    priceAlert: string;
    newNFT: string;
    securityAlert: string;
  };
  
  // Chat
  chat: {
    chat: string;
    tokenChats: string;
    selectToken: string;
    typeMessage: string;
    send: string;
    noMessages: string;
    tokenRequired: string;
    mustOwnToken: string;
    youDontOwn: string;
    loading: string;
    membersOnline: string;
  };
}

// Import additional translations
import { additionalTranslations } from './additionalTranslations';
import { remainingTranslations } from './remainingTranslations';
import { moreTranslations } from './moreTranslations';

export const translations: Record<string, Translations> = {
  en: {
    landing: {
      title: 'Saturn Wallet',
      subtitle: 'Your gateway to the decentralized world',
      getStarted: 'Get Started',
      signIn: 'Sign In',
      features: {
        secure: 'Secure',
        secureDesc: 'Your keys, your crypto',
        easy: 'Easy to Use',
        easyDesc: 'Simple and intuitive interface',
        fast: 'Fast',
        fastDesc: 'Lightning-fast transactions',
      },
    },
    auth: {
      signUp: 'Sign Up',
      signIn: 'Sign In',
      createAccount: 'Create Account',
      welcome: 'Welcome to Saturn',
      welcomeBack: 'Welcome Back',
      username: 'Username',
      usernamePlaceholder: '@username',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      seedPhrase: 'Seed Phrase',
      seedPhrasePlaceholder: 'Enter your 12-word seed phrase',
      continueWithGoogle: 'Continue with Google',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?",
      createNewWallet: 'Create New Wallet',
      importExisting: 'Import Existing Wallet',
      saveSecurely: 'Save your seed phrase securely',
      enterSeedPhrase: 'Enter your seed phrase',
    },
    nav: {
      home: 'Home',
      swap: 'Swap',
      activity: 'Activity',
      settings: 'Settings',
      chat: 'Chat',
      stocks: 'Stocks',
    },
    home: {
      totalBalance: 'Total Balance',
      send: 'Send',
      receive: 'Receive',
      yourAssets: 'Your Assets',
      noAssets: 'No assets yet',
      addToken: 'Add Token',
    },
    sendReceive: {
      send: 'Send',
      receive: 'Receive',
      sendTo: 'Send to',
      amount: 'Amount',
      amountPlaceholder: 'Enter amount',
      recipientAddress: 'Recipient Address',
      recipientPlaceholder: 'Enter wallet address or @username',
      max: 'Max',
      available: 'Available',
      networkFee: 'Network Fee',
      appFee: 'App Fee',
      total: 'Total',
      confirmSend: 'Confirm Send',
      cancel: 'Cancel',
      yourAddress: 'Your Address',
      copyAddress: 'Copy Address',
      shareQR: 'Share QR Code',
      addressCopied: 'Address copied to clipboard',
      selectToken: 'Select Token',
    },
    swap: {
      swap: 'Swap',
      from: 'From',
      to: 'To',
      youPay: 'You Pay',
      youReceive: 'You Receive',
      rate: 'Rate',
      slippage: 'Slippage',
      swapNow: 'Swap Now',
      insufficientBalance: 'Insufficient Balance',
      enterAmount: 'Enter an amount',
    },
    activity: {
      activity: 'Activity',
      transactions: 'Transactions',
      noTransactions: 'No transactions yet',
      sent: 'Sent',
      received: 'Received',
      swapped: 'Swapped',
      pending: 'Pending',
      confirmed: 'Confirmed',
      failed: 'Failed',
      viewExplorer: 'View on Explorer',
      details: 'Details',
      date: 'Date',
      status: 'Status',
      amount: 'Amount',
      fee: 'Fee',
      signature: 'Signature',
    },
    settings: {
      settings: 'Settings',
      title: 'Settings',
      account: 'Account',
      security: 'Security & Privacy',
      preferences: 'Language & Currency',
      about: 'About Suprik',
      inviteFriends: 'Invite Friends',
      logout: 'Logout',
      profile: 'Profile',
      username: 'Username',
      walletAddress: 'Wallet Address',
      connectedAccounts: 'Connected Accounts',
      manageAccounts: 'Manage Accounts',
      general: 'General',
      accountSettings: 'Account Settings',
      accountSettingsDesc: 'Profile, username & accounts',
      preferencesDesc: 'Customize your experience',
      securityDesc: 'Recovery phrase, password & logs',
      themeDesc: 'Choose app colors & style',
      developer: 'Developer',
      testnetMode: 'Testnet Mode',
      usingTestNetwork: 'Using test network',
      enableForTesting: 'Enable for testing',
      switchedToMainnet: 'Switched to Mainnet',
      switchedToTestnet: 'Switched to Testnet',
      testReceiveTokens: 'Test Receive Tokens',
      rpcSettings: 'RPC Settings',
      rpcSettingsDesc: 'Configure network endpoints',
      helpSupport: 'Help & Support',
      helpSupportDesc: 'Get assistance and support',
      inviteFriendsDesc: 'Share Suprik with others',
      aboutDesc: 'Version, features & links',
      lockWallet: 'Lock Wallet',
      signOut: 'Sign Out',
      signedOut: 'Successfully signed out',
      seedPhrase: 'Seed Phrase',
      showSeedPhrase: 'Show Seed Phrase',
      deleteFunds: 'Delete Funds',
      deleteWallet: 'Delete Wallet',
      warning: 'Warning',
      securityWarning: 'Keep your seed phrase safe and never share it',
      displayLanguage: 'Display Language',
      primaryCurrency: 'Primary Currency',
      chooseLanguage: 'Choose your preferred language for the app interface',
      chooseCurrency: 'Choose your preferred currency for displaying values',
      currentSettings: 'Current Settings',
      language: 'Language',
      currency: 'Currency',
      version: 'Version',
      website: 'Website',
      support: 'Support',
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      copy: 'Copy',
      share: 'Share',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      done: 'Done',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      retry: 'Retry',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      all: 'All',
      active: 'Active',
      generic: 'Something',
    },
    messages: {
      success: {
        transactionSent: 'Transaction sent successfully',
        settingsUpdated: 'Settings updated successfully',
        usernameSaved: 'Username saved successfully',
        copied: 'Copied to clipboard',
      },
      error: {
        insufficientBalance: 'Insufficient balance',
        invalidAddress: 'Invalid address',
        transactionFailed: 'Transaction failed',
        loadingFailed: 'Failed to load data',
        saveFailed: 'Failed to save',
        generic: 'Something went wrong',
      },
    },
    nft: {
      nftGallery: 'NFT Gallery',
      myCollection: 'My Collection',
      noNFTs: 'No NFTs yet',
      noNFTsDesc: 'Your NFT collection will appear here',
      viewDetails: 'View Details',
      collection: 'Collection',
      floorPrice: 'Floor Price',
      owner: 'Owner',
      description: 'Description',
      attributes: 'Attributes',
      viewOnExplorer: 'View on Explorer',
    },
    theme: {
      title: 'Theme Customization',
      themeCustomization: 'Theme Customization',
      chooseTheme: 'Choose your theme',
      gradients: 'Gradients',
      classic: 'Classic Purple',
      midnight: 'Midnight Blue',
      sunset: 'Sunset Orange',
      forest: 'Forest Green',
      ocean: 'Ocean Blue',
      aurora: 'Aurora',
      fire: 'Fire',
      neon: 'Neon',
      custom: 'Custom',
    },
    addressBook: {
      title: 'Address Book',
      addressBook: 'Address Book',
      myContacts: 'My Contacts',
      noContacts: 'No contacts yet',
      noContactsDesc: 'Save frequently used addresses here',
      addContact: 'Add Contact',
      editContact: 'Edit Contact',
      deleteContact: 'Delete Contact',
      contactName: 'Contact Name',
      contactAddress: 'Wallet Address',
      network: 'Network',
      save: 'Save',
      delete: 'Delete',
      cancel: 'Cancel',
      recentContacts: 'Recent Contacts',
    },
    biometric: {
      biometricAuth: 'Biometric Authentication',
      faceID: 'Face ID',
      fingerprint: 'Fingerprint',
      enableBiometric: 'Enable Biometric',
      disableBiometric: 'Disable Biometric',
      biometricEnabled: 'Biometric enabled',
      biometricDisabled: 'Biometric disabled',
      authenticating: 'Authenticating...',
      authSuccess: 'Authentication successful',
      authFailed: 'Authentication failed',
      unlockWithBiometric: 'Unlock with Biometric',
    },
    autoLock: {
      autoLock: 'Auto-Lock',
      lockTimeout: 'Lock after inactivity',
      never: 'Never',
      oneMinute: '1 minute',
      fiveMinutes: '5 minutes',
      fifteenMinutes: '15 minutes',
      thirtyMinutes: '30 minutes',
      oneHour: '1 hour',
      locked: 'Wallet Locked',
      unlockWallet: 'Unlock Wallet',
      enterPassword: 'Enter your password',
    },
    notifications: {
      notifications: 'Notifications',
      noNotifications: 'No notifications',
      markAllRead: 'Mark all as read',
      transactionConfirmed: 'Transaction confirmed',
      transactionFailed: 'Transaction failed',
      priceAlert: 'Price alert',
      newNFT: 'New NFT received',
      securityAlert: 'Security alert',
    },
    chat: {
      chat: 'Chat',
      tokenChats: 'Token Chats',
      selectToken: 'Select a token to chat',
      typeMessage: 'Type a message...',
      send: 'Send',
      noMessages: 'No messages yet. Start the conversation!',
      tokenRequired: 'Token Required',
      mustOwnToken: 'You must own this token to send messages',
      youDontOwn: 'You don\'t own',
      loading: 'Loading messages...',
      membersOnline: 'members',
    },
  },
  
  fa: {
    landing: {
      title: 'کیف پول Saturn',
      subtitle: 'دروازه شما به دنیای غیرمتمرکز',
      getStarted: 'شروع کنید',
      signIn: 'ورود',
      features: {
        secure: 'امن',
        secureDesc: 'کلیدهای شما، رمزارزهای شما',
        easy: 'آسان برای استفاده',
        easyDesc: 'رابط کاربری ساده و شهودی',
        fast: 'سریع',
        fastDesc: 'تراکنش‌های فوق‌العاده سریع',
      },
    },
    auth: {
      signUp: 'ثبت‌نام',
      signIn: 'ورود',
      createAccount: 'ساخت حساب',
      welcome: 'به Saturn خوش آمدید',
      welcomeBack: 'خوش برگشتید',
      username: 'نام کاربری',
      usernamePlaceholder: '@نام_کاربری',
      password: 'رمز عبور',
      confirmPassword: 'تکرار رمز عبور',
      seedPhrase: 'عبارت بازیابی',
      seedPhrasePlaceholder: 'عبارت ۱۲ کلمه‌ای خود را وارد کنید',
      continueWithGoogle: 'ادامه با Google',
      alreadyHaveAccount: 'قبلاً حساب دارید؟',
      dontHaveAccount: 'حساب ندارید؟',
      createNewWallet: 'ساخت کیف پول جدید',
      importExisting: 'وارد کردن کیف پول موجود',
      saveSecurely: 'عبارت بازیابی را به صورت امن ذخیره کنید',
      enterSeedPhrase: 'عبارت بازیابی خود را وارد کنید',
    },
    nav: {
      home: 'خانه',
      swap: 'تبدیل',
      activity: 'فعالیت',
      settings: 'تنظیمات',
      chat: 'چت',
      stocks: 'سهام',
    },
    home: {
      totalBalance: 'موجودی کل',
      send: 'ارسال',
      receive: 'دریافت',
      yourAssets: 'دارایی‌های شما',
      noAssets: 'هنوز دارایی ندارید',
      addToken: 'اضافه کردن توکن',
    },
    sendReceive: {
      send: 'ارسال',
      receive: 'دریافت',
      sendTo: 'ارسال به',
      amount: 'مقدار',
      amountPlaceholder: 'مقدار را وارد کنید',
      recipientAddress: 'آدرس گیرنده',
      recipientPlaceholder: 'آدرس کیف پول یا @نام_کاربری را وارد کنید',
      max: 'حداکثر',
      available: 'موجود',
      networkFee: 'کارمزد شبکه',
      appFee: 'کارمزد برنامه',
      total: 'مجموع',
      confirmSend: 'تایید ارسال',
      cancel: 'لغو',
      yourAddress: 'آدرس شما',
      copyAddress: 'کپی آدرس',
      shareQR: 'اشتراک‌گذاری QR',
      addressCopied: 'آدرس کپی شد',
      selectToken: 'انتخاب توکن',
    },
    swap: {
      swap: 'تبدیل',
      from: 'از',
      to: 'به',
      youPay: 'شما می‌پردازید',
      youReceive: 'شما دریافت می‌کنید',
      rate: 'نرخ',
      slippage: 'لغزش',
      swapNow: 'تبدیل کن',
      insufficientBalance: 'موجودی کافی نیست',
      enterAmount: 'مقدار را وارد کنید',
    },
    activity: {
      activity: 'فعالیت',
      transactions: 'تراکنش‌ها',
      noTransactions: 'هنوز تراکنشی ندارید',
      sent: 'ارسال شده',
      received: 'دریافت شده',
      swapped: 'تبدیل شده',
      pending: 'در انتظار',
      confirmed: 'تایید شده',
      failed: 'ناموفق',
      viewExplorer: 'مشاهده در Explorer',
      details: 'جزئیات',
      date: 'تاریخ',
      status: 'وضعیت',
      amount: 'مقدار',
      fee: 'کارمزد',
      signature: 'امضا',
    },
    settings: {
      settings: 'تنظیمات',
      title: 'تنظیمات',
      account: 'حساب کاربری',
      security: 'امنیت و حریم خصوصی',
      preferences: 'زبان و ارز',
      about: 'درباره Suprik',
      inviteFriends: 'دعوت از دوستان',
      logout: 'خروج',
      profile: 'پروفایل',
      username: 'نام کاربری',
      walletAddress: 'آدرس کیف پول',
      connectedAccounts: 'حساب‌های متصل',
      manageAccounts: 'مدیریت حساب‌ها',
      general: 'عمومی',
      accountSettings: 'تنظیمات حساب',
      accountSettingsDesc: 'پروفایل، نام کاربری و حساب‌ها',
      preferencesDesc: 'تجربه خود را شخصی‌سازی کنید',
      securityDesc: 'عبارت بازیابی، رمز عبور و گزارش‌ها',
      themeDesc: 'رنگ‌ها و استایل برنامه را انتخاب کنید',
      developer: 'توسعه‌دهنده',
      testnetMode: 'حالت تست‌نت',
      usingTestNetwork: 'استفاده از شبکه تست',
      enableForTesting: 'فعال برای تست',
      switchedToMainnet: 'به Mainnet تغییر یافت',
      switchedToTestnet: 'به Testnet تغییر یافت',
      testReceiveTokens: 'تست دریافت توکن',
      rpcSettings: 'تنظیمات RPC',
      rpcSettingsDesc: 'پیکربندی نقاط اتصال شبکه',
      helpSupport: 'راهنما و پشتیبانی',
      helpSupportDesc: 'دریافت کمک و پشتیبانی',
      inviteFriendsDesc: 'Suprik را با دیگران به اشتراک بگذارید',
      aboutDesc: 'نسخه، ویژگی‌ها و لینک‌ها',
      lockWallet: 'قفل کیف پول',
      signOut: 'خروج از حساب',
      signedOut: 'با موفقیت خارج شدید',
      seedPhrase: 'عبارت بازیابی',
      showSeedPhrase: 'نمایش عبارت بازیابی',
      deleteFunds: 'حذف موجودی',
      deleteWallet: 'حذف کیف پول',
      warning: 'هشدار',
      securityWarning: 'عبارت بازیابی را ایمن نگه دارید و هرگز با کسی به اشتراک نگذارید',
      displayLanguage: 'زبان نمایش',
      primaryCurrency: 'ارز اصلی',
      chooseLanguage: 'زبان مورد نظر خود را برای رابط برنامه انتخاب کنید',
      chooseCurrency: 'ارز مورد نظر خود را برای نمایش مبالغ انتخاب کنید',
      currentSettings: 'تنظیمات فعلی',
      language: 'زبان',
      currency: 'ارز',
      version: 'نسخه',
      website: 'وب‌سایت',
      support: 'پشتیبانی',
      terms: 'شرایط استفاده',
      privacy: 'حریم خصوصی',
    },
    common: {
      save: 'ذخیره',
      cancel: 'لغو',
      confirm: 'تایید',
      delete: 'حذف',
      edit: 'ویرایش',
      copy: 'کپی',
      share: 'اشتراک',
      close: 'بستن',
      back: 'بازگشت',
      next: 'بعدی',
      done: 'انجام شد',
      loading: 'در حال بارگذاری...',
      error: 'خطا',
      success: 'موفق',
      warning: 'هشدار',
      retry: 'تلاش مجدد',
      search: 'جستجو',
      filter: 'فیلتر',
      sort: 'مرتب‌سازی',
      all: 'همه',
      active: 'فعال',
      generic: 'چیزی',
    },
    messages: {
      success: {
        transactionSent: 'تراکنش با موفقیت ارسال شد',
        settingsUpdated: 'تنظیمات با موفقیت به‌روزرسانی شد',
        usernameSaved: 'نام کاربری با موفقیت ذخیره شد',
        copied: 'کپی شد',
      },
      error: {
        insufficientBalance: 'موجودی کافی نیست',
        invalidAddress: 'آدرس نامعتبر',
        transactionFailed: 'تراکنش ناموفق بود',
        loadingFailed: 'بارگذاری ناموفق بود',
        saveFailed: 'ذخیره ناموفق بود',
        generic: 'مشکلی پیش آمد',
      },
    },
    nft: {
      nftGallery: 'گالری NFT',
      myCollection: 'مجموعه من',
      noNFTs: 'هنوز NFT ندارید',
      noNFTsDesc: 'مجموعه NFT شما اینجا نمایش داده می‌شود',
      viewDetails: 'مشاهده جزئیات',
      collection: 'مجموعه',
      floorPrice: 'قیمت پایه',
      owner: 'مالک',
      description: 'توضیحات',
      attributes: 'ویژگی‌ها',
      viewOnExplorer: 'مشاهده در Explorer',
    },
    theme: {
      title: 'شخصی‌سازی تم',
      themeCustomization: 'شخصی‌سازی تم',
      chooseTheme: 'تم خود را انتخاب کنید',
      gradients: 'رنگ‌بندی‌ها',
      classic: 'بنفش کلاسیک',
      midnight: 'آبی نیمه‌شب',
      sunset: 'نارنجی غروب',
      forest: 'سبز جنگل',
      ocean: 'آبی اقیانوس',
      aurora: 'شفق قطبی',
      fire: 'آتشین',
      neon: 'نئون',
      custom: 'سفارشی',
    },
    addressBook: {
      title: 'دفترچه آدرس',
      addressBook: 'دفترچه آدرس',
      myContacts: 'مخاطبین من',
      noContacts: 'هنوز مخاطبی ندارید',
      noContactsDesc: 'آدرس‌های پرکاربرد را اینجا ذخیره کنید',
      addContact: 'افزودن مخاطب',
      editContact: 'ویرایش مخاطب',
      deleteContact: 'حذف مخاطب',
      contactName: 'نام مخاطب',
      contactAddress: 'آدرس کیف پول',
      network: 'شبکه',
      save: 'ذخیره',
      delete: 'حذف',
      cancel: 'لغو',
      recentContacts: 'مخاطبین اخیر',
    },
    biometric: {
      biometricAuth: 'احراز هویت بیومتریک',
      faceID: 'Face ID',
      fingerprint: 'اثر انگشت',
      enableBiometric: 'فعال‌سازی بیومتریک',
      disableBiometric: 'غیرفعال‌سازی بیومتریک',
      biometricEnabled: 'بیومتریک فعال شد',
      biometricDisabled: 'بیومتریک غیرفعال شد',
      authenticating: 'در حال احراز هویت...',
      authSuccess: 'احراز هویت موفق',
      authFailed: 'احراز هویت ناموفق',
      unlockWithBiometric: 'باز کردن با بیومتریک',
    },
    autoLock: {
      autoLock: 'قفل خودکار',
      lockTimeout: 'قفل شدن بعد از عدم فعالیت',
      never: 'هرگز',
      oneMinute: '۱ دقیقه',
      fiveMinutes: '۵ دقیقه',
      fifteenMinutes: '۱۵ دقیقه',
      thirtyMinutes: '۳۰ دقیقه',
      oneHour: '۱ ساعت',
      locked: 'کیف پول قفل شد',
      unlockWallet: 'باز کردن کیف پول',
      enterPassword: 'رمز عبور خود را وارد کنید',
    },
    notifications: {
      notifications: 'اعلان‌ها',
      noNotifications: 'اعلانی وجود ندارد',
      markAllRead: 'علامت‌گذاری همه به عنوان خوانده شده',
      transactionConfirmed: 'تراکنش تایید شد',
      transactionFailed: 'تراکنش ناموفق بود',
      priceAlert: 'هشدار قیمت',
      newNFT: 'NFT جدید دریافت شد',
      securityAlert: 'هشدار امنیتی',
    },
    chat: {
      chat: 'چت',
      tokenChats: 'چت‌های توکن',
      selectToken: 'یک توکن برای چت انتخاب کنید',
      typeMessage: 'پیام خود را بنویسید...',
      send: 'ارسال',
      noMessages: 'هنوز پیامی نیست. گفتگو را شروع کنید!',
      tokenRequired: 'توکن مورد نیاز است',
      mustOwnToken: 'برای ارسال پیام باید این توکن را داشته باشید',
      youDontOwn: 'شما این توکن را ندارید',
      loading: 'در حال بارگذاری پیام‌ها...',
      membersOnline: 'عضو',
    },
  },
  
  // Spanish translations
  es: {
    landing: {
      title: 'Cartera Saturn',
      subtitle: 'Tu puerta de entrada al mundo descentralizado',
      getStarted: 'Comenzar',
      signIn: 'Iniciar sesión',
      features: {
        secure: 'Seguro',
        secureDesc: 'Tus claves, tus criptomonedas',
        easy: 'Fácil de usar',
        easyDesc: 'Interfaz simple e intuitiva',
        fast: 'Rápido',
        fastDesc: 'Transacciones ultrarrápidas',
      },
    },
    auth: {
      signUp: 'Registrarse',
      signIn: 'Iniciar sesión',
      createAccount: 'Crear cuenta',
      welcome: 'Bienvenido a Saturn',
      welcomeBack: 'Bienvenido de nuevo',
      username: 'Nombre de usuario',
      usernamePlaceholder: '@usuario',
      password: 'Contraseña',
      confirmPassword: 'Confirmar contraseña',
      seedPhrase: 'Frase de recuperación',
      seedPhrasePlaceholder: 'Ingresa tu frase de 12 palabras',
      continueWithGoogle: 'Continuar con Google',
      alreadyHaveAccount: '¿Ya tienes una cuenta?',
      dontHaveAccount: '¿No tienes una cuenta?',
      createNewWallet: 'Crear nueva cartera',
      importExisting: 'Importar cartera existente',
      saveSecurely: 'Guarda tu frase de recuperación de forma segura',
      enterSeedPhrase: 'Ingresa tu frase de recuperación',
    },
    nav: {
      home: 'Inicio',
      swap: 'Intercambiar',
      activity: 'Actividad',
      settings: 'Ajustes',
      chat: 'Chat',
      stocks: 'Acciones',
    },
    home: {
      totalBalance: 'Saldo total',
      send: 'Enviar',
      receive: 'Recibir',
      yourAssets: 'Tus activos',
      noAssets: 'Aún no tienes activos',
      addToken: 'Agregar token',
    },
    sendReceive: {
      send: 'Enviar',
      receive: 'Recibir',
      sendTo: 'Enviar a',
      amount: 'Cantidad',
      amountPlaceholder: 'Ingresa la cantidad',
      recipientAddress: 'Dirección del destinatario',
      recipientPlaceholder: 'Ingresa dirección de cartera o @usuario',
      max: 'Máx',
      available: 'Disponible',
      networkFee: 'Comisión de red',
      appFee: 'Comisión de app',
      total: 'Total',
      confirmSend: 'Confirmar envío',
      cancel: 'Cancelar',
      yourAddress: 'Tu dirección',
      copyAddress: 'Copiar dirección',
      shareQR: 'Compartir código QR',
      addressCopied: 'Dirección copiada',
      selectToken: 'Seleccionar token',
    },
    swap: {
      swap: 'Intercambiar',
      from: 'De',
      to: 'A',
      youPay: 'Pagas',
      youReceive: 'Recibes',
      rate: 'Tasa',
      slippage: 'Deslizamiento',
      swapNow: 'Intercambiar ahora',
      insufficientBalance: 'Saldo insuficiente',
      enterAmount: 'Ingresa una cantidad',
    },
    activity: {
      activity: 'Actividad',
      transactions: 'Transacciones',
      noTransactions: 'Aún no hay transacciones',
      sent: 'Enviado',
      received: 'Recibido',
      swapped: 'Intercambiado',
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      failed: 'Fallido',
      viewExplorer: 'Ver en explorador',
      details: 'Detalles',
      date: 'Fecha',
      status: 'Estado',
      amount: 'Cantidad',
      fee: 'Comisión',
      signature: 'Firma',
    },
    settings: {
      settings: 'Ajustes',
      title: 'Ajustes',
      account: 'Cuenta',
      security: 'Seguridad y Privacidad',
      preferences: 'Idioma y Moneda',
      about: 'Acerca de Suprik',
      inviteFriends: 'Invitar amigos',
      logout: 'Cerrar sesión',
      profile: 'Perfil',
      username: 'Nombre de usuario',
      walletAddress: 'Dirección de cartera',
      connectedAccounts: 'Cuentas conectadas',
      manageAccounts: 'Administrar cuentas',
      general: 'General',
      accountSettings: 'Ajustes de cuenta',
      accountSettingsDesc: 'Perfil, usuario y cuentas',
      preferencesDesc: 'Personaliza tu experiencia',
      securityDesc: 'Frase de recuperación, contraseña y registros',
      themeDesc: 'Elige colores y estilo de la app',
      developer: 'Desarrollador',
      testnetMode: 'Modo Testnet',
      usingTestNetwork: 'Usando red de prueba',
      enableForTesting: 'Activar para pruebas',
      switchedToMainnet: 'Cambiado a Mainnet',
      switchedToTestnet: 'Cambiado a Testnet',
      testReceiveTokens: 'Probar recibir tokens',
      rpcSettings: 'Ajustes RPC',
      rpcSettingsDesc: 'Configurar endpoints de red',
      helpSupport: 'Ayuda y Soporte',
      helpSupportDesc: 'Obtener asistencia y soporte',
      inviteFriendsDesc: 'Comparte Suprik con otros',
      aboutDesc: 'Versión, funciones y enlaces',
      lockWallet: 'Bloquear cartera',
      signOut: 'Cerrar sesión',
      signedOut: 'Sesión cerrada exitosamente',
      seedPhrase: 'Frase de recuperación',
      showSeedPhrase: 'Mostrar frase de recuperación',
      deleteFunds: 'Eliminar fondos',
      deleteWallet: 'Eliminar cartera',
      warning: 'Advertencia',
      securityWarning: 'Mantén tu frase de recuperación segura y nunca la compartas',
      displayLanguage: 'Idioma de visualización',
      primaryCurrency: 'Moneda principal',
      chooseLanguage: 'Elige tu idioma preferido para la interfaz de la app',
      chooseCurrency: 'Elige tu moneda preferida para mostrar valores',
      currentSettings: 'Ajustes actuales',
      language: 'Idioma',
      currency: 'Moneda',
      version: 'Versión',
      website: 'Sitio web',
      support: 'Soporte',
      terms: 'Términos de servicio',
      privacy: 'Política de privacidad',
    },
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      delete: 'Eliminar',
      edit: 'Editar',
      copy: 'Copiar',
      share: 'Compartir',
      close: 'Cerrar',
      back: 'Atrás',
      next: 'Siguiente',
      done: 'Hecho',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      warning: 'Advertencia',
      retry: 'Reintentar',
      search: 'Buscar',
      filter: 'Filtrar',
      sort: 'Ordenar',
      all: 'Todos',
      active: 'Activo',
      generic: 'Algo',
    },
    messages: {
      success: {
        transactionSent: 'Transacción enviada con éxito',
        settingsUpdated: 'Ajustes actualizados con éxito',
        usernameSaved: 'Nombre de usuario guardado con éxito',
        copied: 'Copiado al portapapeles',
      },
      error: {
        insufficientBalance: 'Saldo insuficiente',
        invalidAddress: 'Dirección inválida',
        transactionFailed: 'La transacción falló',
        loadingFailed: 'Error al cargar los datos',
        saveFailed: 'Error al guardar',
        generic: 'Algo salió mal',
      },
    },
    nft: {
      nftGallery: 'Galería de NFT',
      myCollection: 'Mi colección',
      noNFTs: 'Aún no tienes NFT',
      noNFTsDesc: 'Tu colección de NFT aparecerá aquí',
      viewDetails: 'Ver detalles',
      collection: 'Colección',
      floorPrice: 'Precio mínimo',
      owner: 'Propietario',
      description: 'Descripción',
      attributes: 'Atributos',
      viewOnExplorer: 'Ver en explorador',
    },
    theme: {
      title: 'Personalización de tema',
      themeCustomization: 'Personalización de tema',
      chooseTheme: 'Elige tu tema',
      gradients: 'Degradados',
      classic: 'Púrpura clásico',
      midnight: 'Azul medianoche',
      sunset: 'Naranja atardecer',
      forest: 'Verde bosque',
      ocean: 'Azul océano',
      aurora: 'Aurora',
      fire: 'Fuego',
      neon: 'Neón',
      custom: 'Personalizado',
    },
    addressBook: {
      title: 'Libreta de direcciones',
      addressBook: 'Libreta de direcciones',
      myContacts: 'Mis contactos',
      noContacts: 'Aún no tienes contactos',
      noContactsDesc: 'Guarda las direcciones más usadas aquí',
      addContact: 'Agregar contacto',
      editContact: 'Editar contacto',
      deleteContact: 'Eliminar contacto',
      contactName: 'Nombre del contacto',
      contactAddress: 'Dirección de cartera',
      network: 'Red',
      save: 'Guardar',
      delete: 'Eliminar',
      cancel: 'Cancelar',
      recentContacts: 'Contactos recientes',
    },
    biometric: {
      biometricAuth: 'Autenticación biométrica',
      faceID: 'Face ID',
      fingerprint: 'Huella digital',
      enableBiometric: 'Activar biométrica',
      disableBiometric: 'Desactivar biométrica',
      biometricEnabled: 'Biométrica activada',
      biometricDisabled: 'Biométrica desactivada',
      authenticating: 'Autenticando...',
      authSuccess: 'Autenticación exitosa',
      authFailed: 'Autenticación fallida',
      unlockWithBiometric: 'Desbloquear con biométrica',
    },
    autoLock: {
      autoLock: 'Bloqueo automático',
      lockTimeout: 'Bloquear después de inactividad',
      never: 'Nunca',
      oneMinute: '1 minuto',
      fiveMinutes: '5 minutos',
      fifteenMinutes: '15 minutos',
      thirtyMinutes: '30 minutos',
      oneHour: '1 hora',
      locked: 'Cartera bloqueada',
      unlockWallet: 'Desbloquear cartera',
      enterPassword: 'Ingresa tu contraseña',
    },
    notifications: {
      notifications: 'Notificaciones',
      noNotifications: 'Sin notificaciones',
      markAllRead: 'Marcar todas como leídas',
      transactionConfirmed: 'Transacción confirmada',
      transactionFailed: 'Transacción fallida',
      priceAlert: 'Alerta de precio',
      newNFT: 'Nuevo NFT recibido',
      securityAlert: 'Alerta de seguridad',
    },
    chat: {
      chat: 'Chat',
      tokenChats: 'Chats de tokens',
      selectToken: 'Selecciona un token para chatear',
      typeMessage: 'Escribe un mensaje...',
      send: 'Enviar',
      noMessages: 'Aún no hay mensajes. ¡Inicia la conversación!',
      tokenRequired: 'Token requerido',
      mustOwnToken: 'Debes tener este token para enviar mensajes',
      youDontOwn: 'No tienes',
      loading: 'Cargando mensajes...',
      membersOnline: 'miembros',
    },
  },
};

// Merge all translations into one object
Object.assign(translations, additionalTranslations, remainingTranslations, moreTranslations);