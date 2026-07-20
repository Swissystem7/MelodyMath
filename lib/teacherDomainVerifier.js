function teacherDomainVerifier(email, domainWhitelist, customDomains) {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return { isValid: false, domain: null, reason: 'invalid_email_format' };
  }
  const parts = email.split('@');
  const domain = parts[parts.length - 1].toLowerCase();
  const local = parts.slice(0, -1).join('@');
  if (!domain || !local || /\s/.test(domain)) {
    return { isValid: false, domain: null, reason: 'invalid_email_format' };
  }
  const whitelist = (Array.isArray(domainWhitelist) ? domainWhitelist : []).filter(d => typeof d === 'string').map(d => d.toLowerCase());
  const customs = (Array.isArray(customDomains) ? customDomains : []).filter(d => typeof d === 'string').map(d => d.toLowerCase());
  if (whitelist.length === 0 && customs.length === 0) {
    return { isValid: false, domain: domain, reason: 'no_domains_configured' };
  }
  if (whitelist.includes(domain) || customs.includes(domain)) {
    return { isValid: true, domain: domain, reason: 'valid' };
  }
  return { isValid: false, domain: domain, reason: 'domain_not_allowed' };
}
module.exports = { teacherDomainVerifier };
