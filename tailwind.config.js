// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand Color - Professional Teal
        primary: {
          50: '#f0fdfa',   // Très clair - Backgrounds subtils
          100: '#ccfbf1',  // Clair - Hover states légers
          200: '#99f6e4',  // Léger - Badges, pills
          300: '#5eead4',  // Moyen-léger - Icons, illustrations
          400: '#2dd4bf',  // Moyen - Active states
          500: '#14b8a6',  // Base - Links, secondary buttons
          600: '#0d9488',  // PRINCIPAL - Boutons primaires, CTAs
          700: '#0f766e',  // Dark - Hover sur boutons
          800: '#115e59',  // Très dark - Pressed states
          900: '#134e4a',  // Ultra dark - Texte sur fond clair
          950: '#042f2e',  // Maximum dark - Headers
        },
        
        // Secondary/Accent Color - Amber (pour alertes, warnings)
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',  // ACCENT PRINCIPAL
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },

        // Success - Vert
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },

        // Error - Rouge
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },

        // Warning - Orange
        warning: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },

        // Info - Bleu
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },

        // Grays - Pour texte et backgrounds
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        }
      },
      
      // Typography
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },

      // Spacing custom (si besoin)
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      // Border radius
      borderRadius: {
        '4xl': '2rem',
        '5xl': '3rem',
      },

      // Box shadows
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(13, 148, 136, 0.1), 0 10px 20px -2px rgba(13, 148, 136, 0.04)',
        'primary': '0 10px 40px -10px rgba(13, 148, 136, 0.3)',
        'accent': '0 10px 40px -10px rgba(245, 158, 11, 0.3)',
      },

      // Animations
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },

      // Backdrop blur
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    // Optionnel: Ajoute ces plugins si besoin
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
  ],
}

// ============================================
// GUIDE D'UTILISATION DES COULEURS
// ============================================

/*
🎨 PALETTE PRINCIPALE - Professional Teal

1. BOUTONS PRIMAIRES (CTAs importants):
   bg-primary-600 hover:bg-primary-700
   Exemple: "Se connecter", "Créer", "Enregistrer"

2. BOUTONS SECONDAIRES:
   bg-primary-100 text-primary-700 hover:bg-primary-200
   Exemple: "Annuler", "Retour"

3. LINKS:
   text-primary-600 hover:text-primary-700
   
4. BACKGROUNDS SUBTILS:
   bg-primary-50
   Exemple: Cards, sections, alerts success

5. BADGES/PILLS:
   bg-primary-100 text-primary-700
   Exemple: Statuts "Actif", "En ligne"

6. BORDERS:
   border-primary-200
   Exemple: Input focus, cards selected

7. TEXTE SUR FOND TEAL:
   text-white (sur primary-600/700)
   text-primary-900 (sur primary-50/100)

8. GRADIENTS:
   bg-gradient-to-r from-primary-600 to-primary-700
   Exemple: Hero sections, feature cards

---

⚠️ COULEURS ACCENT - Amber

1. WARNINGS/ALERTES:
   bg-accent-100 text-accent-700 border-accent-300
   
2. BADGES "EN ATTENTE":
   bg-accent-100 text-accent-700

3. BOUTONS D'ACTION SECONDAIRE:
   bg-accent-500 text-white hover:bg-accent-600

---

✅ SUCCESS - Vert

1. MESSAGES SUCCESS:
   bg-success-100 text-success-700 border-success-300
   
2. BADGES "ACTIF", "PAYÉ":
   bg-success-100 text-success-700

3. ICONS SUCCESS:
   text-success-600

---

❌ ERROR - Rouge

1. MESSAGES ERREUR:
   bg-error-100 text-error-700 border-error-300
   
2. BADGES "INACTIF", "EXPIRÉ":
   bg-error-100 text-error-700

3. BOUTONS DANGEREUX:
   bg-error-600 hover:bg-error-700 text-white

---

📊 GRAYS - Texte & Backgrounds

1. TEXTE PRINCIPAL:
   text-gray-900

2. TEXTE SECONDAIRE:
   text-gray-600

3. TEXTE DISABLED:
   text-gray-400

4. BACKGROUNDS:
   bg-gray-50 (page background)
   bg-white (cards)
   bg-gray-100 (sections alternées)

5. BORDERS:
   border-gray-200 (standard)
   border-gray-300 (emphasized)

---

🎯 EXEMPLES D'UTILISATION

// Bouton primaire
<button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-primary">
  Se connecter
</button>

// Badge success
<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-success-100 text-success-700">
  Actif
</span>

// Card avec border teal
<div className="bg-white border-2 border-primary-200 rounded-xl p-6">
  Content
</div>

// Alert warning
<div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
  <p className="text-accent-800">Attention...</p>
</div>

// Gradient header
<div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-8">
  Hero content
</div>

// Input focus
<input className="border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 rounded-lg px-3 py-2" />

// Link
<a href="#" className="text-primary-600 hover:text-primary-700 hover:underline font-medium">
  En savoir plus
</a>

*/