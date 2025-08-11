export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1F3B70',         // Lacivert
        accent: '#D73B3E',          // Kırmızı
        background: '#F8F5F0',      // Krem
        text: '#222222',            // Koyu Gri
        hover: '#4B89C4',           // Açık Mavi
        warning: '#F6A800',         // Altın Sarı
      },
    },
  },
  plugins: [],
};
