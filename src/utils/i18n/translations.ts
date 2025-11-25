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
      account: 'Account',
      security: 'Security',
      preferences: 'Preferences',
      about: 'About Saturn',
      inviteFriends: 'Invite Friends',
      logout: 'Logout',
      profile: 'Profile',
      username: 'Username',
      walletAddress: 'Wallet Address',
      connectedAccounts: 'Connected Accounts',
      manageAccounts: 'Manage Accounts',
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
      account: 'حساب کاربری',
      security: 'امنیت',
      preferences: 'تنظیمات شخصی',
      about: 'درباره Saturn',
      inviteFriends: 'دعوت از دوستان',
      logout: 'خروج',
      profile: 'پروفایل',
      username: 'نام کاربری',
      walletAddress: 'آدرس کیف پول',
      connectedAccounts: 'حساب‌های متصل',
      manageAccounts: 'مدیریت حساب‌ها',
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
};
