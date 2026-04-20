# Timelog

A comprehensive time tracking app built with React Native and Expo, designed for freelancers and consultants to manage client projects, track work hours, and generate reports.

## Features

- **Client Management**: Add and organize multiple clients
- **Project Tracking**: Create projects under each client with specific tasks
- **Time Logging**: Track time using range (start-end) or duration methods
- **Flexible Payment**: Support for hourly and fixed-rate tasks
- **Reports & Analytics**: Generate monthly reports and earnings summaries
- **Payment Tracking**: Monitor paid, pending, and partial payments
- **Modern UI**: Clean, intuitive interface with bottom sheets and smooth animations

## Tech Stack

- **React Native** with **Expo** framework
- **TypeScript** for type safety
- **React Navigation** for navigation
- **React Native Reanimated** for animations
- **React Native Gesture Handler** for gestures
- **AsyncStorage** for local data persistence
- **Lucide Icons** for UI icons

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Expo CLI
- iOS Simulator or Android Emulator
- Physical device for testing (recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/Maanojpv/timelog.git
cd timelog

# Install dependencies
npm install

# Start the development server
npm start
```

### Running the App

```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web browser
npm run web
```

### iOS Development Setup

For iOS deployment and App Store submission, see the [iOS Deployment Setup](docs/ios-deployment-setup.md) documentation.

## Project Structure

```
src/
  components/     # Reusable UI components
  context/       # React context and state management
  navigation/     # Navigation configuration
  screens/        # App screens
  theme/          # Colors and styling
  utils/          # Utility functions and helpers
docs/             # Documentation for deployment
```

## Bundle ID

- **iOS**: `com.manoj.timelogapp`
- **Android**: `com.manoj.timelogapp`

## Documentation

- [iOS Deployment Setup](docs/ios-deployment-setup.md) - Step-by-step iOS deployment guide
- [iOS Xcode Deployment](docs/ios-xcode-deployment.md) - Building and uploading to App Store
- [Installing the App](docs/installing-the-app.md) - End-user installation guide

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue on GitHub.
