# Gmail Email Service Setup Guide

## 📧 Setting up Gmail for Email Verification

### Prerequisites

-   A Gmail account
-   2-Factor Authentication enabled on your Gmail account

### Step-by-Step Setup

#### 1. Enable 2-Factor Authentication

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", enable **2-Step Verification**
3. Follow the setup process to secure your account

#### 2. Generate App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **App passwords**
3. Select app: **Mail**
4. Select device: **Other (custom name)**
5. Enter name: **Goru Party Polling App**
6. Click **Generate**
7. Copy the 16-character password (format: xxxx xxxx xxxx xxxx)

#### 3. Configure Environment Variables

Create a `.env` file in your project root and add:

```bash
# Gmail Configuration
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="abcdefghijklmnop"  # 16-character app password (no spaces)
```

**Important**:

-   Use the **App Password**, NOT your regular Gmail password
-   Remove spaces from the app password
-   Keep your `.env` file secure and never commit it to version control

#### 4. Test the Configuration

1. Start your development server: `pnpm dev`
2. Try registering a new user
3. Check the console for email logs
4. If credentials are configured correctly, the email will be sent to the recipient

### Development vs Production

#### Development Mode:

-   Emails are logged to console for debugging
-   If Gmail credentials are provided, emails are also sent
-   Registration flow works even if email sending fails

#### Production Mode:

-   Emails are only sent via Gmail
-   Registration fails if email cannot be sent
-   More robust error handling

### Security Best Practices

1. **Never use your regular Gmail password**
2. **Always use App Passwords for applications**
3. **Keep environment variables secure**
4. **Regularly rotate App Passwords**
5. **Monitor Gmail security activity**

### Troubleshooting

#### Common Issues:

**"Invalid credentials" error:**

-   Ensure 2FA is enabled on your Gmail account
-   Double-check the App Password (16 characters, no spaces)
-   Verify the Gmail address is correct

**"Authentication failed" error:**

-   Make sure you're using an App Password, not your regular password
-   Check if your Gmail account has "Less secure app access" disabled (this is good)

**Emails not being received:**

-   Check spam/junk folder
-   Verify the recipient's email address
-   Check Gmail sending limits (500 emails per day for free accounts)

#### Gmail Sending Limits:

-   **Free Gmail**: 500 emails per day
-   **Google Workspace**: 2,000 emails per day (or more depending on plan)

### Alternative Email Services

If you prefer other email services, you can modify the Nodemailer configuration:

#### Outlook/Hotmail:

```javascript
service: "hotmail";
```

#### Yahoo:

```javascript
service: "yahoo";
```

#### Custom SMTP:

```javascript
host: "your-smtp-server.com";
port: 587;
secure: false;
```

### Support

If you encounter issues:

1. Check the console logs for detailed error messages
2. Verify your Gmail security settings
3. Ensure environment variables are loaded correctly
4. Test with a simple email first
