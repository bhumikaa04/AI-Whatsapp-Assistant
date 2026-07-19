function normalizePhone(phone) {
  if (!phone) return phone;
  phone = phone.trim();
  if (!phone.startsWith("+")) {
    return `+${phone}`;
  }
  return phone;
}

module.exports = normalizePhone;
