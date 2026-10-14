(() => {
  const SUPABASE_URL = 'https://suzkeuxivqsememebout.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_yPav56KIrTwlzQh3Vb7RhQ_PPS1X-ao';
  const client = window.supabase?.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const actions = document.querySelector('.head-actions');
  if (!client || !actions) return;

  const accountButton = document.createElement('button');
  accountButton.className = 'icon-btn';
  accountButton.id = 'authButton';
  accountButton.type = 'button';
  accountButton.setAttribute('aria-label', 'Sign in or manage account');
  accountButton.title = 'Sign in or manage account';
  accountButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>';
  actions.prepend(accountButton);

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'authModal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'authTitle');
  modal.innerHTML = `
    <div class="dialog auth-dialog">
      <div class="dialog-head"><h2 id="authTitle">Your ministry account</h2><button class="close" id="closeAuth" type="button" aria-label="Close dialog"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
      <div class="auth-content">
        <div class="auth-tabs" role="tablist" aria-label="Account access"><button class="auth-tab active" type="button" data-mode="signin" role="tab" aria-selected="true">Sign in</button><button class="auth-tab" type="button" data-mode="signup" role="tab" aria-selected="false">Create account</button></div>
        <form id="authForm" novalidate>
          <div class="auth-fields">
            <div class="auth-field"><label for="authEmail">Email address</label><input id="authEmail" name="email" type="email" autocomplete="email" required maxlength="254" placeholder="you@example.com"></div>
            <div class="auth-field" id="authPhoneField" hidden><label for="authPhone">Mobile number</label><input id="authPhone" name="phone" type="tel" autocomplete="tel" maxlength="32" placeholder="Your mobile number"></div>
            <div class="auth-field" id="authPasswordField"><label for="authPassword">Password</label><div class="password-entry"><input id="authPassword" name="password" type="password" autocomplete="current-password" minlength="8" required placeholder="At least 8 characters"><button class="password-toggle" type="button" data-password-target="authPassword" aria-label="Show password" aria-pressed="false">Show</button></div></div>
            <div class="auth-field" id="authConfirmField" hidden><label for="authConfirm">Confirm new password</label><div class="password-entry"><input id="authConfirm" name="confirm" type="password" autocomplete="new-password" minlength="8" placeholder="Enter the new password again"><button class="password-toggle" type="button" data-password-target="authConfirm" aria-label="Show confirmation password" aria-pressed="false">Show</button></div></div>
          </div>
          <p class="auth-message" id="authMessage" role="status" aria-live="polite"></p>
          <button class="button auth-submit" id="authSubmit" type="submit">Sign in</button>
          <div class="auth-aux"><button class="auth-link" id="forgotPassword" type="button">Forgot password?</button><button class="auth-link" id="backToSignIn" type="button" hidden>Back to sign in</button><button class="auth-link" id="signOut" type="button" hidden>Sign out</button></div>
          <p class="auth-privacy">Your password is securely handled by Supabase and is never stored by this site.</p>
        </form>
        <div class="auth-account" id="authAccount" hidden></div>
      </div>
    </div>`;
  document.body.append(modal);

  const form = modal.querySelector('#authForm');
  const message = modal.querySelector('#authMessage');
  const submit = modal.querySelector('#authSubmit');
  const passwordField = modal.querySelector('#authPasswordField');
  const phoneField = modal.querySelector('#authPhoneField');
  const phoneInput = modal.querySelector('#authPhone');
  const confirmField = modal.querySelector('#authConfirmField');
  const emailInput = modal.querySelector('#authEmail');
  const passwordInput = modal.querySelector('#authPassword');
  const tabs = [...modal.querySelectorAll('.auth-tab')];
  const visitorCount = document.createElement('span');
  visitorCount.className = 'visitor-count';
  visitorCount.innerHTML = 'Signed-in visits <strong aria-live="polite">…</strong>';
  document.querySelector('.footer-bottom')?.append(visitorCount);
  const visitorValue = visitorCount.querySelector('strong');
  const account = modal.querySelector('#authAccount');
  let mode = 'signin';
  let currentUser = null;

  function setMessage(text = '', kind = '') {
    message.textContent = text;
    message.className = `auth-message${kind ? ` ${kind}` : ''}`;
  }

  async function refreshVisitCount() {
    if (!visitorValue) return;
    const { data, error } = await client.rpc('get_signed_in_visits');
    visitorValue.textContent = error ? 'Unavailable' : Number(data).toLocaleString('en-IN');
  }

  async function recordSignedInVisit() {
    if (!visitorValue) return;
    const { data, error } = await client.rpc('increment_signed_in_visits');
    visitorValue.textContent = error ? 'Unavailable' : Number(data).toLocaleString('en-IN');
  }

  refreshVisitCount();

  function setMode(nextMode) {
    mode = nextMode;
    const isAccount = nextMode === 'account';
    const isSignup = nextMode === 'signup';
    const isReset = nextMode === 'reset';
    const isRecovery = nextMode === 'recovery';
    tabs.forEach(tab => {
      tab.hidden = isAccount || isReset || isRecovery;
      tab.classList.toggle('active', tab.dataset.mode === nextMode);
      tab.setAttribute('aria-selected', String(tab.dataset.mode === nextMode));
    });
    passwordField.hidden = isReset || isAccount;
    phoneField.hidden = !(isSignup || isReset);
    phoneInput.required = isSignup || isReset;
    passwordInput.required = !isReset && !isAccount;
    passwordInput.autocomplete = isSignup || isRecovery ? 'new-password' : 'current-password';
    confirmField.hidden = !isRecovery;
    modal.querySelector('#authConfirm').required = isRecovery;
    modal.querySelector('#forgotPassword').hidden = nextMode !== 'signin';
    modal.querySelector('#backToSignIn').hidden = !(isReset || isRecovery);
    modal.querySelector('#signOut').hidden = !isAccount;
    account.hidden = !isAccount;
    form.hidden = isAccount;
    submit.textContent = isSignup ? 'Create account' : isReset ? 'Continue to WhatsApp' : isRecovery ? 'Save new password' : 'Sign in';
    modal.querySelector('#authTitle').textContent = isAccount ? 'Your account' : isReset ? 'Password help' : isRecovery ? 'Choose a new password' : 'Your ministry account';
    modal.querySelector('.auth-privacy').textContent = isReset
      ? 'Share only your registered email and mobile number with ministry support. Never send your password or verification codes.'
      : 'Your password is securely handled by Supabase and is never stored by this site.';
    if (isAccount && currentUser) {
      const name = currentUser.user_metadata?.full_name || currentUser.email || 'Ministry member';
      account.innerHTML = `<strong>${escapeHtml(name)}</strong><small>${escapeHtml(currentUser.email || '')}</small>`;
    }
    setMessage();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  }

  function openModal(nextMode = currentUser ? 'account' : 'signin') {
    setMode(nextMode);
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    emailInput.focus();
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  accountButton.addEventListener('click', () => openModal());
  modal.querySelector('#closeAuth').addEventListener('click', closeModal);
  modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.classList.contains('open')) closeModal(); });
  tabs.forEach(tab => tab.addEventListener('click', () => setMode(tab.dataset.mode)));
  modal.querySelectorAll('.password-toggle').forEach(button => button.addEventListener('click', () => {
    const input = modal.querySelector(`#${button.dataset.passwordTarget}`);
    const showing = input.type === 'password';
    input.type = showing ? 'text' : 'password';
    button.textContent = showing ? 'Hide' : 'Show';
    button.setAttribute('aria-label', `${showing ? 'Hide' : 'Show'} ${input.id === 'authConfirm' ? 'confirmation password' : 'password'}`);
    button.setAttribute('aria-pressed', String(showing));
  }));
  modal.querySelector('#forgotPassword').addEventListener('click', () => setMode('reset'));
  modal.querySelector('#backToSignIn').addEventListener('click', () => setMode('signin'));
  modal.querySelector('#signOut').addEventListener('click', async () => {
    const { error } = await client.auth.signOut();
    if (error) return setMessage(error.message, 'error');
    currentUser = null;
    accountButton.title = 'Sign in or manage account';
    accountButton.setAttribute('aria-label', accountButton.title);
    closeModal();
  });

  document.addEventListener('click', event => {
    const download = event.target.closest('#directory .catalog-item a:last-child, #featuredGrid .card-actions a:last-child');
    if (!download || !download.href || download.href === '#' || currentUser) return;
    event.preventDefault();
    openModal('signin');
    setMessage('Sign in to continue to the resource download.');
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    submit.disabled = true;
    setMessage('Please wait…');
    try {
      if (mode === 'signup') {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}${location.pathname}`,
            data: { mobile_number: phoneInput.value.trim() }
          }
        });
        if (error) throw error;
        if (data.session) {
          currentUser = data.user;
          await recordSignedInVisit();
          closeModal();
        } else {
          setMode('signin');
          setMessage('Account created. Sign in with your email and password.', 'success');
        }
      } else if (mode === 'reset') {
        const message = [
          "Hello Karthick, I need help accessing my David's Music Ministry account.",
          `Registered email: ${email}`,
          `Registered mobile: ${phoneInput.value.trim()}`,
          'I will not send my password or any verification code.'
        ].join('\n');
        window.open(`https://wa.me/919043622386?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
        setMessage('WhatsApp opened with your account details. Please send the message to request help.', 'success');
      } else if (mode === 'recovery') {
        const nextPassword = password;
        if (nextPassword !== modal.querySelector('#authConfirm').value) throw new Error('The passwords do not match.');
        const { error } = await client.auth.updateUser({ password: nextPassword });
        if (error) throw error;
        setMode('signin');
        setMessage('Password updated. You can now sign in with it.', 'success');
      } else {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        currentUser = data.user;
        await recordSignedInVisit();
        closeModal();
      }
    } catch (error) {
      setMessage(error.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      submit.disabled = false;
    }
  });

  client.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;
    accountButton.title = currentUser ? `Signed in: ${currentUser.email}` : 'Sign in or manage account';
    accountButton.setAttribute('aria-label', accountButton.title);
    if (event === 'PASSWORD_RECOVERY') openModal('recovery');
  });

  client.auth.getSession().then(({ data }) => {
    currentUser = data.session?.user || null;
    if (currentUser) {
      accountButton.title = `Signed in: ${currentUser.email}`;
      accountButton.setAttribute('aria-label', accountButton.title);
    }
    if (location.hash.includes('account-recovery')) openModal('recovery');
  });
})();
