const registrationSuccessEmailBody = (name: string) => `
<html>
  <body style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
    <div style="max-width:600px; margin:auto; background:#fff; padding:30px; border-radius:8px; border:1px solid #e0e0e0;">
      <h2 style="color:#1f3a2f;">Welcome to Task Alley, ${name}!</h2>

      <p>Hello <strong>${name}</strong>,</p>

      <p>Congratulations! Your account has been successfully verified. 🎉</p>

      <p>Now you can provide all your additional information to complete your profile. Once your account is approved by the admin, you will be able to post tasks or bid on tasks.</p>

      <div style="background:#eaf4f1; padding:15px; border-radius:6px; margin:20px 0;">
        <p style="margin:0;">✔ Provide your profile details</p>
        <p style="margin:0;">✔ Wait for admin approval</p>
        <p style="margin:0;">✔ Start posting tasks or bidding</p>
      </div>

      <a
        href="https://taskalley-deploy-5lzv.vercel.app/profile"
        style="
          display:inline-block;
          margin-top:20px;
          padding:12px 25px;
          background:#1f3a2f;
          color:#fff;
          text-decoration:none;
          border-radius:6px;
        "
      >
        Complete Your Profile
      </a>

      <p style="margin-top:30px; font-size:14px; color:#888;">
        If you did not create this account, please contact support immediately.
      </p>
    </div>
  </body>
</html>
`;

export default registrationSuccessEmailBody;
