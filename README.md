# FairMatch Generator

A modern web application built with Next.js that helps generate fair and random matches for games. No more arguments over team formation or coin tosses!

## Features

- **Two Game Modes**
  - Singles Mode: Generates sequential player orders
  - Teams Mode: Creates balanced teams with optional double-sider

- **Fair Play Mechanics**
  - Balanced player rotation system
  - Equal play time tracking
  - Random team assignments
  - Automatic coin toss for teams

- **Team Configuration**
  - Customizable team sizes
  - Support for double-sider (player playing for both teams)
  - Automatic player rotation for sitting out

- **User-Friendly Interface**
  - Simple player input with individual or bulk adding
  - Real-time match generation
  - Beautiful UI with responsive design
  - Share results via WhatsApp or clipboard

## Tech Stack

- Next.js 13+
- TypeScript
- Tailwind CSS
- shadcn/ui Components
- Lucide Icons

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## How to Use

1. **Add Players**
   - Enter players individually
   - Or add multiple players using comma-separated names

2. **Configure Match Settings**
   - Choose between Singles or Teams mode
   - Set team size (for Teams mode)
   - Enable/disable double-sider option
   - Set number of matches to generate

3. **Generate Matches**
   - Click "Generate Matches" to create fair and random matches
   - View results with team assignments or player sequences
   - Share results via WhatsApp or copy to clipboard

## Project Structure

- `/app` - Next.js app router pages and layouts
- `/components` - React components including UI elements
- `/lib` - Core logic for match generation
- `/components/ui` - shadcn/ui component library

## Features in Detail

### Singles Mode
- Creates a sequential order of players
- Ensures fair rotation of players
- Tracks play count for balanced participation

### Teams Mode
- Generates balanced teams based on play history
- Optional double-sider feature
- Automatic coin toss for each match
- Fair distribution of sitting out players

## License

MIT License