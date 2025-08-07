'use client'

import { Calculator } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Icons } from "@/components/ui/icons";
import { useAuth } from "@/lib/auth/context";
import LanguageDropdown from "@/components/LanguageDropdown";

export default function MainNavbar() {
  const { user, profile, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-card shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Calculator className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Real Estate Pro Tools</h1>
              <p className="text-xs text-muted-foreground">Ferramentas Profissionais de Imobiliário</p>
            </div>
          </Link>
          
          <div className="flex items-center space-x-4">
            {/* Navigation Links for authenticated users */}
            {user && (
              <nav className="hidden md:flex items-center space-x-6">
                <Link 
                  href="/dashboard" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/calculators" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Calculators
                </Link>
                {profile?.subscription_tier === 'pro' && (
                  <Link 
                    href="/client-management" 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clients
                  </Link>
                )}
              </nav>
            )}

            {/* Language Dropdown - Hidden on mobile */}
            <div className="hidden sm:block">
              <LanguageDropdown />
            </div>
            
            {/* Authentication UI */}
            {loading ? (
              <div className="flex items-center space-x-2">
                <Icons.spinner className="h-4 w-4 animate-spin" />
              </div>
            ) : user ? (
              /* Authenticated User Dropdown */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
                      <AvatarFallback>
                        {profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 
                         user?.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.full_name || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <Icons.home className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <Icons.user className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  {profile?.subscription_tier === 'pro' && (
                    <DropdownMenuItem asChild>
                      <Link href="/client-management" className="cursor-pointer">
                        <Icons.users className="mr-2 h-4 w-4" />
                        <span>Client Management</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Icons.settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  {profile?.subscription_tier !== 'pro' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/pricing" className="cursor-pointer">
                          <Icons.star className="mr-2 h-4 w-4 text-primary" />
                          <span className="text-primary">Upgrade to Pro</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onSelect={handleSignOut}
                  >
                    <Icons.logOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Unauthenticated User Buttons */
              <div className="flex items-center space-x-3">
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/signup">Registar-se</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}