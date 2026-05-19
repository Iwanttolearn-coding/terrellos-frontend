import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';


export default function PageNotFound({}) {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    const { data: authData, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await base44.auth.me();
                return { user, isAuthenticated: true };
            } catch (error) {
                return { user: null, isAuthenticated: false };
            }
        }
    });
    
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-20 h-20 rounded-2xl gradient-purple-blue flex items-center justify-center mx-auto glow-purple">
                    <span className="text-3xl font-bold text-white">404</span>
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">Page Not Found</h2>
                    <p className="text-sm text-muted-foreground">
                        <span className="font-mono text-primary">/{pageName}</span> doesn't exist in this app.
                    </p>
                </div>
                {isFetched && authData?.isAuthenticated && (authData?.user?.role === 'admin' || authData?.user?.role === 'super_admin') && (
                    <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-left">
                        <p className="text-xs font-bold text-yellow-400 mb-1">Admin Note</p>
                        <p className="text-xs text-muted-foreground">
                            This route isn't registered in <span className="font-mono">App.jsx</span>. Add it or navigate to an existing page.
                        </p>
                    </div>
                )}
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => window.history.back()}
                        className="px-4 py-2 text-sm font-medium text-muted-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                        ← Go Back
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-4 py-2 text-sm font-medium text-white rounded-lg gradient-purple-blue hover:opacity-90 transition-opacity"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        </div>
    )
}