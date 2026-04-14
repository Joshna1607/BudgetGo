/**
 * Validates an email address for format and common domain typos.
 * @param {string} email - The email address to validate.
 * @returns {object} - { isValid: boolean, error: string | null }
 */
export const validateEmail = (email) => {
    if (!email) {
        return { isValid: false, error: 'Email is required' };
    }

    // standard email regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return { isValid: false, error: 'Please check your email ID' };
    }

    // Typo detection
    const domain = email.split('@')[1].toLowerCase();
    const typoDomains = [
        'gmil.com',
        'gmal.com',
        'gmill.com',
        'gmai.com',
        'gimail.com',
        'gamil.com',
        'gnail.com',
        'gmsil.com',
        'yaho.com',
        'yahooo.com',
        'hotmal.com',
        'hotmail.cm',
        'outlok.com',
        'iclud.com'
    ];

    if (typoDomains.includes(domain)) {
        return { isValid: false, error: 'Please check your email ID' };
    }

    return { isValid: true, error: null };
};
