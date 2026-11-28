// تبدیل کلیدهای FORM_GROUPS به آبجکت‌هایی که کامپوننت‌های کلاینتی می‌گیرند.
// صفحه‌های سرور این توابع را صدا می‌زنند و نتیجه را به‌صورت prop پایین می‌فرستند،
// چون کامپوننت‌های 'use client' نمی‌توانند مستقیم به دیتابیس وصل شوند.

// هر خط به شکل «عنوان | توضیح» است. اگر جداکننده نبود، کل خط عنوان می‌شود.
export function parsePairs(value) {
  return String(value ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf('|');
      if (i === -1) return { title: line, text: '' };
      return { title: line.slice(0, i).trim(), text: line.slice(i + 1).trim() };
    })
    .filter((item) => item.title);
}

export function authContent(t) {
  return {
    pwTitle: t('auth.pw.title'),
    pwSubtitle: t('auth.pw.subtitle'),
    pwUsername: t('auth.pw.username'),
    pwPassword: t('auth.pw.password'),
    pwRemember: t('auth.pw.remember'),
    pwSubmit: t('auth.pw.submit'),
    pwForgot: t('auth.pw.forgot'),
    smsTitle: t('auth.sms.title'),
    smsSubtitle: t('auth.sms.subtitle'),
    smsPhone: t('auth.sms.phone'),
    smsSend: t('auth.sms.send'),
    smsCode: t('auth.sms.code'),
    smsEditPhone: t('auth.sms.editPhone'),
    smsBack: t('auth.sms.back'),
    wait: t('auth.wait'),
    tabLogin: t('auth.tab.login'),
    tabSignup: t('auth.tab.signup'),
    toSignup: t('auth.switch.toSignup'),
    toLogin: t('auth.switch.toLogin'),
  };
}

export function signupContent(t) {
  return {
    roleTitle: t('signup.role.title'),
    roleSubtitle: t('signup.role.subtitle'),
    roleStudent: t('signup.role.student'),
    roleFilmmaker: t('signup.role.filmmaker'),
    studentTitle: t('signup.student.title'),
    filmmakerTitle: t('signup.filmmaker.title'),
    formSubtitle: t('signup.form.subtitle'),
    labelFirstName: t('signup.label.firstName'),
    labelLastName: t('signup.label.lastName'),
    labelPhone: t('signup.label.phone'),
    labelBirthDate: t('signup.label.birthDate'),
    labelBranch: t('signup.label.branch'),
    labelIdCard: t('signup.label.idCard'),
    labelNationalId: t('signup.label.nationalId'),
    labelGoal: t('signup.label.goal'),
    placeholderGoal: t('signup.placeholder.goal'),
    submit: t('signup.submit'),
    submitting: t('signup.submitting'),
    back: t('signup.back'),
    doneTitle: t('signup.done.title'),
    doneText: t('signup.done.text'),
  };
}

export function verifyContent(t) {
  return {
    title: t('verify.title'),
    subtitle: t('verify.subtitle'),
    formTitle: t('verify.formTitle'),
    placeholder: t('verify.placeholder'),
    submit: t('verify.submit'),
    checking: t('verify.checking'),
    valid: t('verify.valid'),
    revoked: t('verify.revoked'),
  };
}
