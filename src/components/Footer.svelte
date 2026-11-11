<script lang="ts">
  import { t } from "$lib/i18n";
  import { withLang } from "$lib/utils/withLang";
</script>

<footer class="site-footer">
  <div class="footer-inner">
    <!-- Left: brand -->
    <div class="footer-brand">
      <div class="brand-top">
        <div class="brand-icon" aria-hidden="true">N</div>
        <div class="brand-name">{$t('common.footer.brand')}</div>
      </div>

      <p class="brand-desc">
        {$t('common.footer.tagline')}
      </p>

      <div class="social-row">
        <a class="social-link" href="#" aria-label="Twitter">
          <iconify-icon icon="lucide:twitter" width="16"></iconify-icon>
        </a>
        <a class="social-link" href="#" aria-label="Instagram">
          <iconify-icon icon="lucide:instagram" width="16"></iconify-icon>
        </a>
        <a class="social-link" href="#" aria-label="Linkedin">
          <iconify-icon icon="lucide:linkedin" width="16"></iconify-icon>
        </a>
      </div>
    </div>

    <!-- Right: columns -->
    <nav class="footer-links" aria-label="Footer">
      <div class="footer-col">
        <div class="col-title">{$t('common.footer.discover')}</div>
        <a href={withLang('/events')}>{$t('common.nav.events')}</a>
        <a href={withLang('/communities')}>{$t('common.nav.communities')}</a>
        <a href={withLang('/members')}>{$t('common.nav.people')}</a>
      </div>

      <div class="footer-col">
        <div class="col-title">{$t('common.footer.myHub')}</div>
        <a href={withLang('/profile')}>{$t('common.footer.profile')}</a>
        <a href={withLang('/calendar')}>{$t('common.nav.calendar')}</a>
        <a href={withLang('/wallet')}>{$t('common.nav.wallet')}</a>
        <a href={withLang('/chat')}>{$t('common.nav.chat')}</a>
      </div>

      <div class="footer-col">
        <div class="col-title">{$t('common.footer.platform')}</div>
        <a href={withLang('/login')}>{$t('common.footer.signIn')}</a>
        <a href={withLang('/register')}>{$t('common.btn.register')}</a>
      </div>
    </nav>
  </div>

  <div class="footer-bottom">
    <span class="copyright">{$t('common.footer.copyright')}</span>
  </div>
</footer>

<style>
.site-footer {
  background: #fff;
  color: #0f172a;
  border-top: 1px solid #e2e8f0;
  padding: 48px 0 0;
}

.footer-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 18px;
  display: grid;
  grid-template-columns: 1.2fr 2fr;
  gap: 56px;
  align-items: start;
}

.footer-brand .brand-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: #4f46e5;
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 900;
  font-size: 14px;
}

.brand-name {
  font-weight: 900;
  font-size: 17px;
  color: #0f172a;
}

.brand-desc {
  margin: 14px 0 18px;
  color: #64748b;
  line-height: 1.65;
  max-width: 340px;
  font-size: 13px;
  font-weight: 600;
}

.social-row {
  display: flex;
  gap: 8px;
}

.social-link {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  display: grid;
  place-items: center;
  color: #64748b;
  text-decoration: none;
  transition: all 0.15s;
}

.social-link:hover {
  background: rgba(79, 70, 229, 0.06);
  border-color: rgba(79, 70, 229, 0.2);
  color: #4f46e5;
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(3, minmax(140px, 1fr));
  gap: 40px;
  justify-content: end;
}

.footer-col .col-title {
  font-size: 11px;
  letter-spacing: 0.1em;
  font-weight: 900;
  color: #94a3b8;
  margin-bottom: 14px;
}

.footer-col a {
  display: block;
  color: #475569;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  padding: 5px 0;
  transition: color 0.15s;
}

.footer-col a:hover {
  color: #4f46e5;
}

.footer-bottom {
  max-width: 1280px;
  margin: 40px auto 0;
  padding: 18px 18px;
  border-top: 1px solid #e2e8f0;
}

.copyright {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
}

/* Responsive */
@media (max-width: 900px) {
  .footer-inner {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .footer-links {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
}

@media (max-width: 520px) {
  .footer-links {
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
}

</style>
