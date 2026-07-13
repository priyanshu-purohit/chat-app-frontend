import { Eye, EyeOff, ShieldCheck, Mail, User, Lock } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function AuthForm({ isRegister }) {


    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setIsSubmitting(true);

        let result;
        if (isRegister) {
            result = await register(username, email, password);
        }
        else {
            result = await login(email, password);
        }

        setIsSubmitting(false);

        if (result.success) {
            navigate('/');
        }
        else {
            setErrorMsg(result.error);
        }
    };


    return (
        <div className="min-h-screen w-full flex flex-col justify-center bg-slate-950 items-center gap-7 selection:bg-brand-500/30">

            <div className="border p-2 rounded-2xl bg-slate-900 border-slate-700">
                <ShieldCheck className='h-6 w-6' />
            </div>

            <div className='flex flex-col items-center gap-2'>
                <h1 className='text-4xl font-semibold text-blue-500'>
                    {isRegister ? 'Create Account' : 'Welcome Back'}</h1>
                <span className='text-slate-400'>{isRegister ? 'Join Nexus Chat to connect' : 'Access your chats instantly'}</span>
            </div>

            <div className="h-max w-110 bg-slate-900 border border-slate-700 rounded-xl px-6 py-9">

                {errorMsg && (
                    <div className='mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400'>
                        {errorMsg}
                    </div>
                )}

                <form
                    className="flex flex-col gap-8"
                    onSubmit={handleSubmit}
                >

                    {isRegister && (
                        <div className='flex flex-col gap-2'>
                            <label className='text-sm font-semibold text-slate-200 uppercase'>
                                Username
                            </label>
                            <div className="relative">

                                <User className="size-4 text-slate-400 absolute top-3 left-3" />

                                <input
                                    type="text"
                                    placeholder="username"
                                    className="border border-slate-700 rounded-lg bg-slate-800 w-full px-2 py-2 pl-9 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    value={username}
                                    required
                                    onChange={(e) => setUsername(e.target.value)}
                                />

                            </div>
                        </div>
                    )}
                    <div className="flex flex-col gap-3">

                        <label className="text-sm font-semibold text-slate-200 uppercase">
                            Email address
                        </label>

                        <div className="relative">

                            <Mail className="size-4 text-slate-400 absolute top-3 left-3" />

                            <input
                                type="email"
                                placeholder="name@nexus.com"
                                className="border border-slate-700 rounded-lg bg-slate-800 w-full px-2 py-2 pl-9 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                value={email}
                                required
                                onChange={(e) => setEmail(e.target.value)}
                            />

                        </div>
                    </div>

                    <div className="flex flex-col gap-3">

                        <label className="text-sm font-semibold uppercase text-slate-200">
                            Password
                        </label>

                        <div className="relative">

                            <Lock className="size-4 text-slate-400 absolute top-3 left-3" />

                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="********"
                                className="border border-slate-700 rounded-lg bg-slate-800 w-full px-2 py-2 pl-9 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                value={password}
                                required
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 cursor-pointer">
                                {showPassword ? <Eye className="size-5 text-slate-400" />
                                    :
                                    <EyeOff className="size-5 text-slate-400" />}
                            </button>
                        </div>

                    </div>

                    <div className="flex flex-col gap-5 items-center">

                        <button
                            type='submit'
                            disabled={isSubmitting}
                            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold text-white transition-colors duration-200 cursor-pointer"
                        >
                            {isSubmitting ? 'Authenticating' : isRegister ? 'Register' : 'Login'}
                        </button>

                        <div className="mt-6 text-center text-xs text-slate-400">
                            {isRegister ? (
                                <p>Already have an account?{' '}
                                    <Link to="/login" className="font-semibold text-brand-400 hover:underline">
                                        Sign In
                                    </Link>
                                </p>

                            ) :
                                (
                                    <p>
                                        Don't have an account?{' '}
                                        <Link to='/register' className='font-semibold text-brand-400 hover:underline'>
                                            Sign Up
                                        </Link>
                                    </p>
                                )}
                        </div>

                    </div>

                </form>
            </div>
        </div >
    );
};