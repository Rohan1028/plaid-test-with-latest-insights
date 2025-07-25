import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIntakeStatus } from '@/hooks/useIntakeStatus';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const {
    signIn,
    signUp,
    user
  } = useAuth();
  const {
    hasCompletedIntake,
    loading: intakeLoading
  } = useIntakeStatus();
  const {
    toast
  } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !intakeLoading) {
      if (hasCompletedIntake) {
        console.log('Authenticated user with completed intake, redirecting to chat');
        navigate('/chat');
      } else {
        console.log('Authenticated user without completed intake, redirecting to welcome');
        navigate('/welcome');
      }
    }
  }, [user, hasCompletedIntake, intakeLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        const {
          error
        } = await signUp(email, password, fullName);
        if (error) {
          toast({
            title: "Sign up failed",
            description: error.message || "An error occurred during sign up",
            variant: "destructive"
          });
        } else {
          setIsSignUp(false);
        }
      } else {
        const {
          error
        } = await signIn(email, password);
        if (error) {
          toast({
            title: "Sign in failed",
            description: error.message || "Invalid email or password",
            variant: "destructive"
          });
        } else {
          console.log('Login successful, will redirect based on intake status');
          // Redirect logic is handled in useEffect above
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: "Authentication failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return <div className="min-h-screen relative overflow-hidden flex items-start justify-center pt-16 sm:pt-20" style={{
    minHeight: '100dvh'
  }}>
      {/* Image Background - Extended to cover full screen including status bar */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-[-1]" style={{
      height: '100dvh',
      top: '0',
      left: '0'
    }}>
        <img src="/lovable-uploads/6e80b9c3-9c7f-4be6-aa99-496fc3b3b23f.png" alt="Login background" className="absolute w-full h-full object-cover" style={{
        width: '100vw',
        height: '100dvh',
        objectFit: 'cover'
      }} />
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* Back button - Top left with better mobile positioning */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
        <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center gap-1 sm:gap-2 text-white font-medium hover:text-white hover:bg-white/30 backdrop-blur-lg font-sans text-sm sm:text-base p-3 sm:px-5 sm:py-3 border border-white/30 rounded-xl shadow-lg drop-shadow-lg">
          <ArrowLeft size={16} className="sm:w-5 sm:h-5" />
          <span className="hidden xs:inline">Back to Home</span>
          <span className="xs:hidden">Back</span>
        </Button>
      </div>

      {/* Unified Container with Header and Form */}
      <div className="relative z-10 w-full max-w-md px-6 sm:px-8">
        <div className="bg-black/40 backdrop-blur-xl border border-white/30 rounded-3xl p-8 sm:p-10 shadow-2xl opacity-0 animate-[fade-in_1.2s_ease-out_0.6s_forwards]">
          {/* Dynamic Header based on sign in/up mode */}
          <div className="text-center mb-8 sm:mb-10">
            <div className="flex justify-center mb-3 sm:mb-4">
              <img src="/lovable-uploads/1372b572-0ca7-4711-a810-e9f6e6d0f1f3.png" alt="Incluya Logo" className="h-16 sm:h-20 w-auto drop-shadow-xl" />
            </div>
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-xl sm:text-2xl font-medium text-white font-sans drop-shadow-lg">
                {isSignUp ? 'Sign up' : 'Welcome Back!'}
              </h2>
              <p className="text-white text-base sm:text-lg leading-relaxed font-sans font-normal drop-shadow-md">
                {isSignUp ? (
                  <>
                    Better vibes, better finances.
                    <br />
                    Start Now
                  </>
                ) : (
                  'Better vibes, better finances.'
                )}
              </p>
            </div>
          </div>

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {isSignUp && <div className="space-y-2">
                <label htmlFor="fullName" className="block text-sm font-medium text-white font-sans drop-shadow-md">
                  Full Name
                </label>
                <Input id="fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your full name" className="w-full bg-black/30 border border-white/30 text-white placeholder:text-white/80 backdrop-blur-lg font-sans font-normal text-base shadow-lg hover:bg-black/40 transition-all duration-200 py-3" required={isSignUp} />
              </div>}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-white font-sans drop-shadow-md">
                Email address
              </label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" className="w-full bg-black/30 border border-white/30 text-white placeholder:text-white/80 backdrop-blur-lg font-sans font-normal text-base shadow-lg hover:bg-black/40 transition-all duration-200 py-3" required />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-white font-sans drop-shadow-md">
                Password
              </label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" className="w-full pr-10 bg-black/30 border border-white/30 text-white placeholder:text-white/80 backdrop-blur-lg font-sans font-normal text-base shadow-lg hover:bg-black/40 transition-all duration-200 py-3" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/80 hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {!isSignUp && <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-white font-medium hover:text-white/80 underline font-sans transition-colors drop-shadow-md">
                  Forgot password?
                </Link>
              </div>}

            <Button type="submit" disabled={isLoading} className="w-full bg-white hover:bg-gray-100 text-black py-4 font-medium border border-white/30 hover:border-gray-300 transition-all duration-300 font-sans text-base shadow-lg disabled:opacity-50 hover:shadow-xl drop-shadow-lg">
              {isLoading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>

            {/* Toggle Sign Up/Sign In */}
            <div className="text-center pt-4">
              <p className="text-white font-sans font-normal text-base drop-shadow-md">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{" "}
                <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-white hover:text-white/80 underline font-medium transition-colors">
                  {isSignUp ? 'Sign in here' : 'Sign up here'}
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>;
};
export default Login;
