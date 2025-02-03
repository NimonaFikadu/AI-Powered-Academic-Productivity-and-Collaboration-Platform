import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", "class"],
  theme: {
  	extend: {
  		screens: {
  			sm: '576px',
  			md: '768px',
  			lg: '992px',
  			xl: '1200px',
  			xxl: '1400px',
  			'3xl': '1600px',
  			'4xl': '1800px'
  		},
  		colors: {
  			n0: '#1D1E24',
  			n30: '#EBECED',
  			lightN30: '#373D4B',
  			lightBg1: '#23262B',
  			n100: '#7B8088',
  			n200: '#6D717B',
  			n300: '#5E636E',
  			n400: '#525763',
  			lightN400: '#C2C4C8',
  			n500: '#434956',
  			n700: '#262D3B',
  			primaryColor: 'rgb(var(--primary-color) / <alpha-value>)',
  			secondaryColor: 'rgb(142, 51, 255)',
  			errorColor: 'rgb(255, 86, 48)',
  			warningColor: 'rgb(255, 171, 0)',
  			successColor: 'rgb(34, 197, 94)',
  			infoColor: 'rgb(0, 184, 217)',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		padding: {
  			'25': '100px',
  			'30': '120px',
  			'15': '60px'
  		},
  		keyframes: {
  			'fade-in-down': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(-10px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'fade-out-up': {
  				'0%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				},
  				'100%': {
  					opacity: '0',
  					transform: 'translateY(-10px)'
  				}
  			}
  		},
  		animation: {
  			'fade-in-down': 'fade-in-down 0.5s ease-out',
  			'fade-out-up': 'fade-out-up 0.5s ease-out'
  		},
  		typography: {
  			DEFAULT: {
  				css: {
  					color: 'inherit',
  					a: {
  						color: 'rgb(77, 107, 254)',
  						'&:hover': {
  							color: 'rgb(77, 107, 254, 0.8)'
  						}
  					},
  					h1: {
  						color: 'inherit'
  					},
  					h2: {
  						color: 'inherit'
  					},
  					h3: {
  						color: 'inherit'
  					},
  					h4: {
  						color: 'inherit'
  					},
  					code: {
  						color: 'inherit'
  					},
  					pre: {
  						backgroundColor: '#f3f4f6',
  						color: 'inherit'
  					},
  					strong: {
  						color: 'inherit'
  					},
  					blockquote: {
  						color: 'inherit'
  					},
  					'code::before': {
  						content: "'`'"
  					},
  					'code::after': {
  						content: "'`'"
  					},
  					table: {
  						width: '100%',
  						borderCollapse: 'separate',
  						borderSpacing: 0,
  						borderColor: '#e5e7eb',
  						borderWidth: '1px',
  						tableLayout: 'auto',
  						fontSize: '0.875rem',
  						lineHeight: '1.25rem'
  					},
  					th: {
  						backgroundColor: '#f9fafb',
  						fontWeight: '600',
  						textAlign: 'left',
  						padding: '0.75rem',
  						borderBottomWidth: '1px',
  						borderRightWidth: '1px',
  						borderColor: '#e5e7eb'
  					},
  					'th:last-child': {
  						borderRightWidth: '0'
  					},
  					td: {
  						padding: '0.75rem',
  						borderBottomWidth: '1px',
  						borderRightWidth: '1px',
  						borderColor: '#e5e7eb'
  					},
  					'td:last-child': {
  						borderRightWidth: '0'
  					},
  					'tbody tr:last-child td': {
  						borderBottomWidth: '0'
  					},
  					'.math, .math-inline, .math-display': {
  						fontFamily: 'KaTeX_Math',
  						fontStyle: 'normal'
  					}
  				}
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [
    require('@tailwindcss/typography'),
      require("tailwindcss-animate")
],
} satisfies Config;
