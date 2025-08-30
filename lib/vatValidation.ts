// EU country codes that support VIES validation
export const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
];

// Country code to country name mapping
export const COUNTRY_NAMES: Record<string, string> = {
  'AT': 'Austria',
  'BE': 'Belgium', 
  'BG': 'Bulgaria',
  'HR': 'Croatia',
  'CY': 'Cyprus',
  'CZ': 'Czech Republic',
  'DK': 'Denmark',
  'EE': 'Estonia',
  'FI': 'Finland',
  'FR': 'France',
  'DE': 'Germany',
  'GR': 'Greece',
  'HU': 'Hungary',
  'IE': 'Ireland',
  'IT': 'Italy',
  'LV': 'Latvia',
  'LT': 'Lithuania',
  'LU': 'Luxembourg',
  'MT': 'Malta',
  'NL': 'Netherlands',
  'PL': 'Poland',
  'PT': 'Portugal',
  'RO': 'Romania',
  'SK': 'Slovakia',
  'SI': 'Slovenia',
  'ES': 'Spain',
  'SE': 'Sweden'
};

export interface VatValidationResult {
  valid: boolean;
  companyName?: string;
  companyAddress?: string;
  error?: string;
}

export const isEUVatNumber = (vatNumber: string): boolean => {
  if (!vatNumber || vatNumber.length < 4) return false;
  const countryCode = vatNumber.substring(0, 2).toUpperCase();
  return EU_COUNTRIES.includes(countryCode);
};

// Format VAT number for display
export const formatVATNumber = (vatNumber: string): string => {
  if (!vatNumber) return '';
  return vatNumber.toUpperCase().replace(/\s/g, '');
};

// Validate VAT number format without API check
export const isValidVATFormat = (vatNumber: string): boolean => {
  if (!vatNumber) return false;
  
  const formatted = formatVATNumber(vatNumber);
  
  // Basic format: 2 letters + 4-15 alphanumeric characters
  return /^[A-Z]{2}[A-Z0-9]{4,15}$/.test(formatted);
};

// Get country name from VAT number
export const getVATCountryName = (vatNumber: string): string => {
  if (!vatNumber || vatNumber.length < 2) return '';
  const countryCode = vatNumber.substring(0, 2).toUpperCase();
  return COUNTRY_NAMES[countryCode] || countryCode;
};

// Client-side VAT format validation with specific error messages
export const validateVATFormat = (vatNumber: string): { valid: boolean; error?: string } => {
  if (!vatNumber) {
    return { valid: false, error: 'VAT number is required' };
  }

  const formatted = formatVATNumber(vatNumber);

  if (formatted.length < 4) {
    return { valid: false, error: 'VAT number is too short' };
  }

  if (formatted.length > 17) {
    return { valid: false, error: 'VAT number is too long' };
  }

  if (!/^[A-Z]{2}/.test(formatted)) {
    return { valid: false, error: 'VAT number must start with 2 letters (country code)' };
  }

  if (!/^[A-Z]{2}[A-Z0-9]{2,15}$/.test(formatted)) {
    return { valid: false, error: 'VAT number contains invalid characters' };
  }

  const countryCode = formatted.substring(0, 2);
  if (!EU_COUNTRIES.includes(countryCode)) {
    return { valid: false, error: `${countryCode} is not a valid EU country code` };
  }

  return { valid: true };
};

// Validate VAT number with backend API
export const validateVATWithAPI = async (vatNumber: string): Promise<VatValidationResult> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/vat/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ vatNumber: formatVATNumber(vatNumber) }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return {
        valid: data.data.valid,
        companyName: data.data.companyName,
        companyAddress: data.data.companyAddress,
        error: data.data.error
      };
    } else {
      return {
        valid: false,
        error: data.msg || 'Failed to validate VAT number'
      };
    }
  } catch (error) {
    console.error('VAT validation error:', error);
    return {
      valid: false,
      error: 'Network error occurred while validating VAT number'
    };
  }
};

// Update user VAT number
export const updateUserVAT = async (vatNumber: string): Promise<{ success: boolean; error?: string; user?: any }> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/vat`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ vatNumber: vatNumber ? formatVATNumber(vatNumber) : '' }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return {
        success: true,
        user: data.user
      };
    } else {
      return {
        success: false,
        error: data.msg || 'Failed to update VAT number'
      };
    }
  } catch (error) {
    console.error('Update VAT error:', error);
    return {
      success: false,
      error: 'Network error occurred while updating VAT number'
    };
  }
};