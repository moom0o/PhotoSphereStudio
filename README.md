# PhotoSphereStudio
Upload 360° photos to Google Maps without using Google's app.

The main reason why I created this is because Google Maps isn't a good replacement of the former app. You are only able to upload 360 photos to specific places on the map. With this project, it is possible to upload them at any coordinates.

A public instance is running at https://maps.moomoo.me/
## Quick start
In order to get the Google api keys required for the oauth follow these steps:

### Client ID
1) Create a new project at https://console.cloud.google.com/

2) Head over to the API library and enable the <a href="https://console.cloud.google.com/apis/library/streetviewpublish.googleapis.com">Street View Publish API</a>

3) Select 'Create Credentials', select 'User Data', enter any app name/email.

4) Enable the 'Street View Publish API' scope. You won't need any sensitive scopes.

5) Select 'Web application' for type, and name it anything.

6) Add http://localhost:7000 to authorized javascript origins. (If you are running on another domain/port, replace localhost)

7) Add http://localhost:7000/auth/ to authorized redirect URIs (If you are running on another domain/port, replace localhost)

8) You should now copy the Client ID into the config.json file.

### Client Secret
Head to the main credentials screen and click the pencil. (Edit OAuth Client) You will be able to find the Client Secret and copy that to your config.json.

### Consent Screen
1) Select 'OAuth consent screen', use any name/email

2) Make sure the authorized domain and email is correct, then select 'Save and Continue'.

3) Make sure the Street View Publish API scope is enabled, if not, add it!

4) For test users, add the email address of the account where you want to upload 360 photos.

5) **Make sure to also copy the client ID into index.html**, after '&client_id=' and before '&scope', if needed, change the port and domain here as well.
