import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const provider = (searchParams.get('provider') || 'Google').trim();
  const providerClean = provider.charAt(0).toUpperCase() + provider.slice(1);

  const configs: Record<string, { bg: string; card_bg: string; primary: string; primary_hover: string; logo: string; title: string; subtitle: string; btn_text: string; default_email: string; default_name: string }> = {
    Google: {
      bg: '#f8f9fa',
      card_bg: '#ffffff',
      primary: '#1a73e8',
      primary_hover: '#1557b0',
      logo: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.22-.66-.35-1.36-.35-2.09z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
      </svg>`,
      title: 'Sign in with Google',
      subtitle: 'Use your Google workspace account',
      btn_text: 'Next',
      default_email: 'rajranjeet7680@gmail.com',
      default_name: 'Ranjeet Kumar'
    },
    Facebook: {
      bg: '#f0f2f5',
      card_bg: '#ffffff',
      primary: '#1877f2',
      primary_hover: '#166fe5',
      logo: `<svg width="36" height="36" viewBox="0 0 24 24" fill="#1877f2" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>`,
      title: 'Log Into Facebook',
      subtitle: 'Connect your recruiter workspace',
      btn_text: 'Log In',
      default_email: 'recruiter@facebook.com',
      default_name: 'Nexora Recruiter'
    },
    Microsoft: {
      bg: '#ebf3fc',
      card_bg: '#ffffff',
      primary: '#0067b8',
      primary_hover: '#005da6',
      logo: `<svg width="32" height="32" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
          <path fill="#f35325" d="M0 0h11v11H0z"/>
          <path fill="#81bc06" d="M12 0h11v11H12z"/>
          <path fill="#05a6f0" d="M0 12h11v11H0z"/>
          <path fill="#ffba08" d="M12 12h11v11H12z"/>
      </svg>`,
      title: 'Sign in',
      subtitle: 'Use your work or school account',
      btn_text: 'Sign In',
      default_email: 'ranjeet@microsoft.com',
      default_name: 'Ranjeet Kumar'
    },
    Linkedin: {
      bg: '#f3f2ef',
      card_bg: '#ffffff',
      primary: '#0a66c2',
      primary_hover: '#004182',
      logo: `<svg width="32" height="32" viewBox="0 0 24 24" fill="#0a66c2" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
      </svg>`,
      title: 'Sign in',
      subtitle: 'Stay updated on your professional world',
      btn_text: 'Sign In',
      default_email: 'rajranjeet7680@gmail.com',
      default_name: 'Ranjeet Kumar'
    }
  };

  const cfg = configs[providerClean] || configs.Google;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in with ${providerClean}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background-color: ${cfg.bg};
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      color: #1f2937;
    }
    .card {
      background-color: ${cfg.card_bg};
      border-radius: 14px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 400px;
      padding: 40px 32px;
      box-sizing: border-box;
      border: 1px solid #e5e7eb;
    }
    .logo-container {
      display: flex;
      justify-content: center;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 20px;
      font-weight: 600;
      text-align: center;
      margin: 0 0 8px 0;
      color: #111827;
    }
    .subtitle {
      font-size: 13px;
      color: #6b7280;
      text-align: center;
      margin: 0 0 28px 0;
    }
    .form-group {
      margin-bottom: 18px;
    }
    label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    input {
      width: 100%;
      padding: 11px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 13px;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus {
      border-color: ${cfg.primary};
    }
    .btn-primary {
      width: 100%;
      padding: 12px;
      background-color: ${cfg.primary};
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s, transform 0.1s;
      margin-top: 10px;
    }
    .btn-primary:hover {
      background-color: ${cfg.primary_hover};
    }
    .btn-primary:active {
      transform: scale(0.98);
    }
    .footer {
      margin-top: 28px;
      font-size: 11px;
      color: #9ca3af;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-container">
      ${cfg.logo}
    </div>
    <h1>${cfg.title}</h1>
    <p class="subtitle">${cfg.subtitle}</p>
    
    <form id="login-form">
      <div class="form-group">
        <label for="email">Work Email</label>
        <input type="email" id="email" value="${cfg.default_email}" required>
      </div>
      <div class="form-group">
        <label for="name">Full Name</label>
        <input type="text" id="name" value="${cfg.default_name}" required>
      </div>
      <button type="submit" class="btn-primary">${cfg.btn_text}</button>
    </form>
    
    <div class="footer">
      Secured by Nexora Federated SSO Gateway.
    </div>
  </div>

  <script>
    document.getElementById('login-form').addEventListener('submit', function(e) {
      e.preventDefault();
      var email = document.getElementById('email').value;
      var name = document.getElementById('name').value;
      
      if (window.opener) {
        window.opener.postMessage({
          type: 'social-login-success',
          provider: '${providerClean}',
          email: email,
          name: name
        }, '*');
      }
      window.close();
    });
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
