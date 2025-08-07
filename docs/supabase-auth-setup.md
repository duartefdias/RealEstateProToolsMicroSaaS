# Supabase Authentication Setup Guide

This guide will help you configure Supabase Authentication for Real Estate Pro Tools with both email/password and Google OAuth support.

## Prerequisites

1. A Supabase project (created in Phase 1)
2. Access to your Supabase dashboard
3. Google Cloud Console access (for OAuth)

## Step 1: Configure Environment Variables

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

## Step 2: Configure Supabase Auth Settings

### Basic Authentication Settings

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Configure the following:

#### Site URL
- **Development**: `http://localhost:3000`
- **Production**: `https://realestateprotools.com`

#### Redirect URLs
Add these URLs to allow redirects after authentication:
- `http://localhost:3000/auth/callback` (development)
- `https://realestateprotools.com/auth/callback` (production)
- `http://localhost:3000/dashboard` (development)
- `https://realestateprotools.com/dashboard` (production)

#### Email Settings
1. **Enable email confirmations**: ✅ Enabled
2. **Enable email change confirmations**: ✅ Enabled
3. **Email confirmation template**: Customize with Real Estate Pro Tools branding
4. **Password recovery template**: Customize with branded messaging

## Step 3: Configure Google OAuth (Optional but Recommended)

### Create Google OAuth Application

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**

### Configure OAuth Client

1. **Application type**: Web application
2. **Name**: Real Estate Pro Tools
3. **Authorized JavaScript origins**:
   - `http://localhost:3000` (development)
   - `https://realestateprotools.com` (production)
4. **Authorized redirect URIs**:
   - `https://your-project-id.supabase.co/auth/v1/callback` (replace with your project ID)

### Configure in Supabase

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click configure
3. **Enable Google provider**: ✅
4. Enter your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
5. **Skip nonce check**: ✅ (recommended for better UX)

## Step 4: Configure Email Templates

### Customize Email Templates

1. Go to **Authentication** → **Email Templates**
2. Customize each template with Real Estate Pro Tools branding:

#### Confirm Email Template
```html
<h2>Welcome to Real Estate Pro Tools!</h2>
<p>Please confirm your email address by clicking the link below:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your account</a></p>
<p>If you didn't create an account with us, you can safely ignore this email.</p>
```

#### Reset Password Template
```html
<h2>Reset Your Password</h2>
<p>We received a request to reset your password for Real Estate Pro Tools.</p>
<p><a href="{{ .ConfirmationURL }}">Reset your password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
```

#### Email Change Template
```html
<h2>Confirm Your New Email</h2>
<p>Please confirm your new email address by clicking the link below:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm new email</a></p>
```

## Step 5: Configure Security Settings

### Password Requirements
1. **Minimum password length**: 8 characters
2. **Require special characters**: ✅ Recommended
3. **Require numbers**: ✅ Recommended
4. **Require uppercase**: ✅ Recommended

### Session Settings
1. **Session timeout**: 1 week (recommended)
2. **Refresh token rotation**: ✅ Enabled
3. **Additional session security**: ✅ Enabled

### Rate Limiting
Configure rate limiting to prevent abuse:
1. **Login attempts**: 5 attempts per hour per IP
2. **Password reset**: 3 requests per hour per email
3. **Email confirmation**: 3 requests per hour per email

## Step 6: Test Authentication Flow

### Testing Email/Password Authentication

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000/auth/signup`
3. Create a test account
4. Check your email for confirmation
5. Test login at `http://localhost:3000/auth/login`

### Testing Google OAuth

1. Navigate to `http://localhost:3000/auth/login`
2. Click "Continue with Google"
3. Complete OAuth flow
4. Verify redirect to dashboard

### Testing Password Recovery

1. Navigate to `http://localhost:3000/auth/forgot-password`
2. Enter test email
3. Check email for reset link
4. Complete password reset flow

## Step 7: Production Deployment

### Environment Configuration

Update your production environment variables:
```env
NEXT_PUBLIC_SITE_URL=https://realestateprotools.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
```

### Update Redirect URLs

In Supabase Dashboard:
1. Update Site URL to production domain
2. Update redirect URLs to production domain
3. Update Google OAuth authorized origins and redirect URIs

### SSL Certificate

Ensure your production domain has a valid SSL certificate for secure authentication.

## Troubleshooting

### Common Issues

1. **OAuth redirect not working**:
   - Check redirect URLs in both Supabase and Google Console
   - Ensure URLs match exactly (no trailing slashes)

2. **Email confirmations not sending**:
   - Check email template configuration
   - Verify SMTP settings in Supabase
   - Check spam folder

3. **Users not being created**:
   - Verify database trigger is active
   - Check profiles table RLS policies
   - Review Supabase logs

### Debug Mode

Enable debug logging in development:
```javascript
// In your auth context or Supabase client
const supabase = createClient(url, key, {
  auth: {
    debug: process.env.NODE_ENV === 'development'
  }
})
```

## Security Best Practices

1. **Never expose service role key** on client-side
2. **Use environment variables** for all sensitive data
3. **Enable RLS policies** on all database tables
4. **Regularly rotate** API keys and secrets
5. **Monitor authentication logs** for suspicious activity
6. **Use HTTPS** in production
7. **Implement rate limiting** on auth endpoints

## Additional Features

### Custom Email Provider (Optional)

For branded emails, configure a custom SMTP provider:
1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Configure your email service (e.g., Resend, SendGrid)
3. Update email templates with your branding

### Multi-Factor Authentication (Future)

Supabase supports MFA for additional security:
1. Enable MFA in Authentication settings
2. Support TOTP and SMS verification
3. Implement in your application UI

This completes the Supabase Authentication setup. Users can now sign up with email/password or Google OAuth, and the system will automatically create profiles and handle authentication securely.