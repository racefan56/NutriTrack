exports.getWelcomeMessage = (req, res) => {
  try {
    res.status(200).send(
      `<h1>Welcome to NutriTrack on the server! Are you lost?</h1>
      
      <p>This domain is for the server side of the Nutritrack app only, please use the client side of the application to login and make requests to the server side of the app. The client side of the app can be found at the following URL...</p>

        ${process.env.FRONTEND_URL}
        
        <p>Thank you</p>`
    );
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
