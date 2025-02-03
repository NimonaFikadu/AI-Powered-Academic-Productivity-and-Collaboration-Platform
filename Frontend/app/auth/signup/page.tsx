"use client";
import React, { FormEvent, useState, useEffect } from "react";
import Image from "next/image";
import displayImg from "@/public/images/sign-up-page-img.png";
import FormInput from "@/components/ui/FormInput";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Alert from "@/components/ui/Alert";
import { authService } from "../authService";
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  Sparkles, 
  User,
  BarChart3, 
  ShieldCheck, 
  ChevronDown, 
  BookOpen, 
  Brain,
  Globe
} from "lucide-react";
import { useTranslation } from "react-i18next";

// Validation types
type ValidationErrors = {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  password?: string;
};

function SignUp() {
  // Form values
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });

  // Form validation errors
  const [errors, setErrors] = useState<ValidationErrors>({});
  
  // Form touched state
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  
  // Alerts
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const router = useRouter();
  const { t, i18n } = useTranslation();

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle input blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  // Validate email format
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Validate form fields
  const validateForm = () => {
    let valid = true;
    const newErrors: ValidationErrors = {};

    if (!formValues.firstName.trim()) {
      newErrors.firstName = "First name is required";
      valid = false;
    }

    if (!formValues.lastName.trim()) {
      newErrors.lastName = "Last name is required";
      valid = false;
    }

    if (!formValues.username.trim()) {
      newErrors.username = "Username is required";
      valid = false;
    } else if (formValues.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
      valid = false;
    }

    if (!formValues.email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!isValidEmail(formValues.email)) {
      newErrors.email = "Please enter a valid email address";
      valid = false;
    }

    if (!formValues.password) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (formValues.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      validateForm();
    }
  }, [formValues]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const allTouched = Object.keys(formValues).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    
    setTouched(allTouched);
    
    const isValid = validateForm();
    
    if (!isValid) {
      setAlert({
        message: "Please correct the errors in the form",
        type: 'error'
      });
      return;
    }

    setIsLoading(true);
    
    const fullName = `${formValues.firstName} ${formValues.lastName}`.trim();

    try {
      const response = await authService.signup({
        username: formValues.username,
        email: formValues.email,
        password: formValues.password,
        fullName
      });

      setAlert({
        message: response.message || "Account created successfully!",
        type: 'success'
      });

      setTimeout(() => {
        router.push("/home");
      }, 1500);
    } catch (error: any) {
      console.error('[LOG signup] ========= Signup error:', error);
      
      if (error.message) {
        if (error.message.includes("Username already taken")) {
          setErrors(prev => ({ ...prev, username: "This username is already taken" }));
        } else if (error.message.includes("Email already registered")) {
          setErrors(prev => ({ ...prev, email: "This email is already registered" }));
        }
        
        setAlert({
          message: error.message,
          type: 'error'
        });
      } else {
        setAlert({
          message: "Error creating account. Please try again.",
          type: 'error'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh w-full bg-[#FFFFFF] dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans overflow-hidden transition-colors duration-300">
      {alert && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <Alert
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      {/* Left Column (Form) - 55% */}
      <div className="flex w-full flex-col lg:w-[55%] relative z-10 bg-white dark:bg-slate-950 transition-colors duration-300">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-6 sm:p-8 md:px-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B74FF] to-[#7B2CBF] text-white shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">UniHub</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium">
              <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">{t('auth.alreadyHaveAccount')} </span>
              <Link href="/auth/login" className="text-[#0B74FF] hover:text-[#5C3CC2] dark:hover:text-[#8b61ff] transition-colors font-semibold">
                {t('auth.login')}
              </Link>
            </div>
            
            {/* Language Switcher */}
            <div className="relative group z-50">
              <button type="button" className="flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none">
                <Globe className="h-4 w-4" />
                <span className="uppercase text-[10px] sm:text-xs">{i18n.language || 'en'}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              <div className="absolute top-full right-0 mt-1 w-32 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                <button type="button" onClick={() => i18n.changeLanguage('en')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">English</button>
                <button type="button" onClick={() => i18n.changeLanguage('am')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">አማርኛ (Amharic)</button>
                <button type="button" onClick={() => i18n.changeLanguage('om')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Afaan Oromoo</button>
              </div>
            </div>
          </div>
        </div>

        {/* Center Form Container */}
        <div className="flex flex-1 items-center justify-center px-4 sm:px-8 py-24">
          <div className="w-full max-w-[440px]">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t('auth.getStarted')}</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('auth.signupSubtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 sm:gap-5">
              <div className="max-sm:col-span-2">
                <div className="[&>div>p]:text-slate-700 dark:[&>div>p]:text-slate-300 [&>div>p]:font-semibold [&>div>div]:border-slate-200 dark:[&>div>div]:border-slate-800 [&>div>div]:bg-white dark:[&>div>div]:bg-slate-900/50 hover:[&>div>div]:border-slate-300 dark:hover:[&>div>div]:border-slate-700 focus-within:[&>div>div]:border-[#0B74FF] dark:focus-within:[&>div>div]:border-[#0B74FF] focus-within:[&>div>div]:ring-1 focus-within:[&>div>div]:ring-[#0B74FF] [&_input]:text-slate-900 dark:[&_input]:text-white [&_input]:font-medium">
                  <FormInput 
                    title={t('auth.firstName')}
                    placeholder={t('auth.firstNamePlaceholder')}
                    name="firstName"
                    value={formValues.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.firstName ? errors.firstName : undefined}
                    required
                  />
                </div>
              </div>
              
              <div className="max-sm:col-span-2">
                <div className="[&>div>p]:text-slate-700 dark:[&>div>p]:text-slate-300 [&>div>p]:font-semibold [&>div>div]:border-slate-200 dark:[&>div>div]:border-slate-800 [&>div>div]:bg-white dark:[&>div>div]:bg-slate-900/50 hover:[&>div>div]:border-slate-300 dark:hover:[&>div>div]:border-slate-700 focus-within:[&>div>div]:border-[#0B74FF] dark:focus-within:[&>div>div]:border-[#0B74FF] focus-within:[&>div>div]:ring-1 focus-within:[&>div>div]:ring-[#0B74FF] [&_input]:text-slate-900 dark:[&_input]:text-white [&_input]:font-medium">
                  <FormInput 
                    title={t('auth.lastName')}
                    placeholder={t('auth.lastNamePlaceholder')}
                    name="lastName"
                    value={formValues.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.lastName ? errors.lastName : undefined}
                    required
                  />
                </div>
              </div>

              <div className="relative col-span-2">
                <div className="pointer-events-none absolute left-4 top-[48px] sm:top-[56px] text-slate-400 dark:text-slate-500 z-10">
                  <User className="h-5 w-5" />
                </div>
                <div className="[&>div>div]:pl-11 [&>div>p]:text-slate-700 dark:[&>div>p]:text-slate-300 [&>div>p]:font-semibold [&>div>div]:border-slate-200 dark:[&>div>div]:border-slate-800 [&>div>div]:bg-white dark:[&>div>div]:bg-slate-900/50 hover:[&>div>div]:border-slate-300 dark:hover:[&>div>div]:border-slate-700 focus-within:[&>div>div]:border-[#0B74FF] dark:focus-within:[&>div>div]:border-[#0B74FF] focus-within:[&>div>div]:ring-1 focus-within:[&>div>div]:ring-[#0B74FF] [&_input]:text-slate-900 dark:[&_input]:text-white [&_input]:font-medium">
                  <FormInput
                    title={t('auth.username')}
                    placeholder={t('auth.usernamePlaceholder')}
                    name="username"
                    value={formValues.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.username ? errors.username : undefined}
                    required
                  />
                </div>
              </div>

              <div className="relative col-span-2">
                <div className="pointer-events-none absolute left-4 top-[48px] sm:top-[56px] text-slate-400 dark:text-slate-500 z-10">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="[&>div>div]:pl-11 [&>div>p]:text-slate-700 dark:[&>div>p]:text-slate-300 [&>div>p]:font-semibold [&>div>div]:border-slate-200 dark:[&>div>div]:border-slate-800 [&>div>div]:bg-white dark:[&>div>div]:bg-slate-900/50 hover:[&>div>div]:border-slate-300 dark:hover:[&>div>div]:border-slate-700 focus-within:[&>div>div]:border-[#0B74FF] dark:focus-within:[&>div>div]:border-[#0B74FF] focus-within:[&>div>div]:ring-1 focus-within:[&>div>div]:ring-[#0B74FF] [&_input]:text-slate-900 dark:[&_input]:text-white [&_input]:font-medium">
                  <FormInput
                    title={t('auth.email')}
                    placeholder={t('auth.emailPlaceholder')}
                    type="email"
                    name="email"
                    value={formValues.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.email ? errors.email : undefined}
                    required
                  />
                </div>
              </div>

              <div className="relative col-span-2">
                <div className="pointer-events-none absolute left-4 top-[48px] sm:top-[56px] text-slate-400 dark:text-slate-500 z-10">
                  <Lock className="h-5 w-5" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-[48px] sm:top-[56px] rounded-md p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 z-10 transition-colors"
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                <div className="[&>div>div]:pl-11 [&>div>div]:pr-12 [&>div>p]:text-slate-700 dark:[&>div>p]:text-slate-300 [&>div>p]:font-semibold [&>div>div]:border-slate-200 dark:[&>div>div]:border-slate-800 [&>div>div]:bg-white dark:[&>div>div]:bg-slate-900/50 hover:[&>div>div]:border-slate-300 dark:hover:[&>div>div]:border-slate-700 focus-within:[&>div>div]:border-[#0B74FF] dark:focus-within:[&>div>div]:border-[#0B74FF] focus-within:[&>div>div]:ring-1 focus-within:[&>div>div]:ring-[#0B74FF] [&_input]:text-slate-900 dark:[&_input]:text-white [&_input]:font-medium">
                  <FormInput
                    title={t('auth.password')}
                    placeholder={t('auth.createPasswordPlaceholder')}
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formValues.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.password ? errors.password : undefined}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`col-span-2 mt-4 inline-flex w-full items-center justify-between rounded-full bg-gradient-to-r from-[#0B74FF] to-[#7B2CBF] px-6 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] ${
                  isLoading ? "opacity-70 cursor-not-allowed" : "hover:shadow-blue-500/40 hover:-translate-y-0.5"
                }`}
              >
                <span>{isLoading ? t('auth.creatingAccount') : t('auth.createAccount')}</span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center p-6 sm:p-8 md:px-12">
          <div className="hidden sm:flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
            <span className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 transition-colors">{t('auth.noAds')}</span>
            <span className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 transition-colors">{t('auth.privateByDefault')}</span>
            <span className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 transition-colors">{t('auth.progressTracking')}</span>
          </div>
        </div>
      </div>

      {/* Right Column (Visual) - 45% */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-[#0B74FF] via-[#5C3CC2] to-[#7B2CBF] overflow-hidden p-12 items-center justify-center border-l border-slate-200/20 dark:border-slate-800 shadow-[-8px_0_30px_rgba(0,0,0,0.1)] z-20">
        {/* Abstract Background Waves */}
        <div className="absolute -top-[20%] -right-[10%] h-[800px] w-[800px] rounded-full bg-white/10 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-[20%] -left-[10%] h-[700px] w-[700px] rounded-full bg-[#E5B8F4]/20 blur-[100px] pointer-events-none" />
        
        {/* Tagline */}
        <div className="absolute top-16 left-12 right-12 z-20 drop-shadow-lg">
          <h2 className="text-[40px] font-bold text-white leading-[1.1] tracking-tight whitespace-pre-line">{t('auth.studySmarter')}<br/>{t('auth.notHarder')}</h2>
          <p className="mt-4 text-white/90 text-[15px] font-medium drop-shadow-md max-w-[300px]">{t('auth.studySmarterSub')}</p>
        </div>

        {/* The Picture */}
        <div className="absolute bottom-0 right-0 w-[95%] max-w-[500px] pointer-events-none z-10">
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#6A32C1] via-[#6A32C1]/80 to-transparent z-10" />
          <Image
            src={displayImg}
            alt="Student learning"
            className="w-full h-auto object-contain object-bottom drop-shadow-[0_20px_50px_rgba(0,0,0,0.4)] opacity-95"
            priority
          />
        </div>

        {/* Smart Compact Widgets */}
        <div className="absolute top-[35%] left-[8%] z-30 animate-bounce" style={{ animationDuration: '6s' }}>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-3.5 backdrop-blur-xl shadow-2xl flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400/50 to-blue-600/50 text-white border border-white/20">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-white leading-tight">10K+</p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-blue-50">{t('auth.notesCreated')}</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-[25%] left-[12%] z-30 animate-bounce" style={{ animationDuration: '7s', animationDelay: '1s' }}>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-3.5 backdrop-blur-xl shadow-2xl flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400/50 to-purple-600/50 text-white border border-white/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">{t('auth.secureData')}</p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-purple-50">{t('auth.privateByDefault')}</p>
            </div>
          </div>
        </div>

        {/* Floating Badges */}
        <div className="absolute top-[25%] right-[15%] h-12 w-12 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center animate-bounce shadow-2xl z-20" style={{ animationDuration: '5s' }}>
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <div className="absolute bottom-[45%] right-[8%] h-10 w-10 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center animate-bounce shadow-2xl z-20" style={{ animationDuration: '4s', animationDelay: '2s' }}>
          <Brain className="h-4 w-4 text-white" />
        </div>
      </div>
    </div>
  );
}

export default SignUp;

