
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
				serif: ["Georgia", "serif"],
				'display': ["'Poppins'", "'Inter'", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
				'dm-sans': ["'DM Sans'", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
				'roboto-slab': ["'Roboto Slab'", "serif"],
			},
			borderWidth: {
				'12': '12px',
				'16': '16px',
				'20': '20px',
				'24': '24px',
				'28': '28px',
				'32': '32px',
				'36': '36px',
				'40': '40px',
				'48': '48px',
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				incluya: {
					yellow: "#F8E9A1",
					"yellow-dark": "#F3D250",
					turquoise: "#A8E6CF",
					"turquoise-dark": "#3AAFA9",
					peach: "#FFD3B6", 
					coral: "#FF8B94",
					cream: "#FEF9F2",
					"text-dark": "#2D3436",
					"nav-dark": "#152124"
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'fade-in': {
					from: { opacity: '0', transform: 'translateY(10px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'shimmer': {
					'0%': { backgroundPosition: '200% 0' },
					'100%': { backgroundPosition: '-200% 0' }
				},
				'breathe': {
					'0%, 100%': { 
						transform: 'scale(1)', 
						opacity: '1' 
					},
					'50%': { 
						transform: 'scale(1.02)', 
						opacity: '0.95' 
					}
				},
				'gentle-pulse': {
					'0%, 100%': { 
						opacity: '1',
						transform: 'scale(1)'
					},
					'50%': { 
						opacity: '0.92',
						transform: 'scale(1.01)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'float': 'float 6s ease-in-out infinite',
				'fade-in': 'fade-in 0.7s ease-out forwards',
				'shimmer': 'shimmer 3s ease-in-out infinite',
				'breathe': 'breathe 6s ease-in-out infinite',
				'gentle-pulse': 'gentle-pulse 8s ease-in-out infinite'
			},
			backgroundImage: {
				'gradient-yellow': 'linear-gradient(135deg, #F8E9A1 0%, #F3D250 100%)',
				'gradient-turquoise': 'linear-gradient(135deg, #A8E6CF 0%, #3AAFA9 100%)',
				'login-pattern': 'url("/lovable-uploads/662645d6-8ae2-4099-a117-b86b743abb01.png")'
			},
			backgroundSize: {
				'300%': '300%'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
