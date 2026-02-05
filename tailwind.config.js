/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				terminal: {
					bg: "#0a0a0a",
					green: "#33ff00",
					amber: "#ffb000",
					muted: "#3A9B3A",
					red: "#ff3333",
					border: "#3A9B3A",
				},
			},
			fontFamily: {
				mono: ['"JetBrains Mono"', "monospace"],
			},
			borderRadius: {
				none: "0px",
			},
			animation: {
				blink: "blink 1s step-end infinite",
				typing: "typing 3.5s steps(40, end)",
				glitch: "glitch 0.3s ease-in-out",
			},
			keyframes: {
				blink: {
					"0%, 50%": { opacity: "1" },
					"51%, 100%": { opacity: "0" },
				},
				typing: {
					from: { width: "0" },
					to: { width: "100%" },
				},
				glitch: {
					"0%": { transform: "translate(0)" },
					"20%": { transform: "translate(-2px, 2px)" },
					"40%": { transform: "translate(-2px, -2px)" },
					"60%": { transform: "translate(2px, 2px)" },
					"80%": { transform: "translate(2px, -2px)" },
					"100%": { transform: "translate(0)" },
				},
			},
			textShadow: {
				terminal: "0 0 5px rgba(51, 255, 0, 0.5)",
				amber: "0 0 5px rgba(255, 176, 0, 0.5)",
			},
		},
	},
	plugins: [
		function ({ addUtilities }) {
			const newUtilities = {
				".text-shadow-terminal": {
					textShadow: "0 0 5px rgba(51, 255, 0, 0.5)",
				},
				".text-shadow-amber": {
					textShadow: "0 0 5px rgba(255, 176, 0, 0.5)",
				},
			};
			addUtilities(newUtilities);
		},
	],
};
