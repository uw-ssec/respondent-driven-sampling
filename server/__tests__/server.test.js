// Import required modules for testing
const path = require('path');

// Mock dependencies before requiring the server
jest.mock('express', () => {
  const json = jest.fn().mockReturnValue('json-middleware');
  const staticMiddleware = jest.fn().mockReturnValue('static-middleware');
  
  const mockApp = {
    use: jest.fn().mockReturnThis(),
    get: jest.fn().mockReturnThis(),
    listen: jest.fn().mockReturnThis()
  };
  
  const mockExpress = jest.fn(() => mockApp);
  mockExpress.json = json;
  mockExpress.static = staticMiddleware;
  
  return mockExpress;
});

jest.mock('cors', () => jest.fn(() => 'cors-middleware'));
jest.mock('../database', () => jest.fn());
jest.mock('../routes/auth', () => 'auth-routes');
jest.mock('../routes/pages', () => 'pages-routes');
jest.mock('../routes/surveys', () => 'surveys-routes');
jest.mock('path', () => ({
  join: jest.fn(() => '/mocked/path/to/client/build')
}));

describe('Server', () => {
  let app;
  let connectDB;
  let express;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset the module cache for index.js
    jest.resetModules();
    
    // Import mocks
    express = require('express');
    connectDB = require('../database');
    
    // Now import the server app
    app = require('../index');
  });
  
  test('should connect to the database', () => {
    expect(connectDB).toHaveBeenCalledTimes(1);
  });
  
  test('should set up middleware correctly', () => {
    expect(express.json).toHaveBeenCalledTimes(1);
    expect(app.use).toHaveBeenCalledWith('json-middleware');
    expect(app.use).toHaveBeenCalledWith('cors-middleware');
  });
  
  test('should set up routes correctly', () => {
    expect(app.use).toHaveBeenCalledWith('/api/auth', 'auth-routes');
    expect(app.use).toHaveBeenCalledWith('/api/pages', 'pages-routes');
    expect(app.use).toHaveBeenCalledWith('/api/surveys', 'surveys-routes');
  });
  
  // TODO: Fix this test
  // test('should serve static files from client/build', () => {
    
  //   expect(path.join).toHaveBeenCalledWith(expect.any(String), '../../client/build');
  //   expect(express.static).toHaveBeenCalledWith('/mocked/path/to/client/build');
  //   expect(app.use).toHaveBeenCalledWith('static-middleware');
  // });
  
  test('should set up catch-all route for React Router', () => {
    expect(app.get).toHaveBeenCalledWith('*', expect.any(Function));
  });
}); 