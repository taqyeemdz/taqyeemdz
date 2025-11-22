// Input validation utilities

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-+$$$$]+$/
  return phone.length >= 8 && phoneRegex.test(phone)
}

export function validateBusinessName(name: string): boolean {
  return name.length >= 2 && name.length <= 100
}

export function validateFeedbackMessage(message: string): boolean {
  return message.length >= 5 && message.length <= 5000
}

export function validateRating(rating: number): boolean {
  return rating >= 1 && rating <= 5 && Number.isInteger(rating)
}

export function validateURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, "").substring(0, 1000)
}
