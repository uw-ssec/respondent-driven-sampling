# RDS Database 

The RDS App uses Azure's Cosmos DB for MongoDB service as its database. It allows us to use MongoDB workflows and tools to interact with the database. This database is a NoSQL database and our data is stored as documents with key value pairs. The name of the resource on Azure that is the database is `rds-pit-app` in the `RDS-PIT-APP` resource group.

## Collections and Models
In the database there are collections which are a grouping of similar data, this is similar to tables in SQL databases. There are 3 collections in the database with each collection having a model that represents that data being stored. The models are defined in the code in the folder `server/models/`. Each file in this folder represents one model.

### Survey Model
This model that represents a survey that has been recorded in the database. It contains information about the employee that took the survey, where and when the survey was taken, a list of children referral codes, other metadata, and the responses object itself. The responses object is an object that contains key value pairs for the responses to the survey. All answers are stored as strings.

### User Model
The user model represents a user of the app. These users include volunteers taking surveys, managers at survey sites and administrators that oversee the entire project. The user model contains an employee ID string that is unique to every user, basic user info (name, email, phone), a role, a list of permissions, and the approval status of the user. Users are generated in the database on successful signup through the app. Initially the approval status of a user is set to pending until another user with approval permissions either approves or rejects the user.

The role of a user can either be `Volunteer`, `Manager`, or `Admin`. Roles are used to determine default permissions of users and sets a hierarchy of users limiting lower roles from affecting higher role users. Alongside roles, users have permissions which determines which actions they are able to do on our app. The permissions are stored as a list of permission objects that contain a type and limiter. Duplicate types of permissions are not allowed in this list and the limiter can either be `Self` or `All` which denotes of a permission is only applicable to the user's on self or globally. Not all combinations of limiters and types are valid though. The following a list of all permission types:

- `view_survey`
    - `Self`: User can only view surveys they have taken.
    - `All`: User can view all surveys.
- `delete_survey`
    - `Self`: User can only delete surveys they have taken.
    - `All`: User can delete all surveys.
- `change_perms`
    - `All`: User can change the perms of any user at the same level or below them.
- `view_profile`
    - `Self`: User can only view their own profile.
    - `All`: User can view all profiles.
- `edit_profile` (Requires `view_profile` perms to edit a profile)  
**Editing a profile allows users to change first name, last name, phone, and email of a user.*
    - `Self`: User can only edit their own profile.
    - `All`: User can edit all profiles.
- `approve_user` (Requires `view_profile` perms to approve a profile)  
    - `All`: User can approval all users at the same level or below them.

### Location Model
The location model represents a survey location site that surveys are being taken at. Currently this model is not being used by the app but it is intended to populate the survey pre-screener question about where the survey is being taken. The location model stores the name of the location, type, address, and other geolocation markers.

## MongoDB Compass
One of the many ways to manually view and interact with the database is through a tool called MongoDB Compass. This tool allows you to see all the collections in the database, edit any values stored, and export the data to JSON or CSV format.

### Setting Up Compass

1. Download and install MongoDB Compass from [this website](https://www.mongodb.com/try/download/compass).

2. Acquire the Cosmos DB URI from the `.env` file.
    - If you do not have access to the secrets file you can find the URI in **Connection strings** tab under the Cosmos DB resource on the Azure dashboard. This URI however will be missing the password which you must acquire from an administrator.
3. In MongoDB Compass, click the plus symbol next to the **CONNECTIONS** sub-menu. Then paste in the Cosmos DB URI into the large box labeled "URI". Then hit **Save & Connect**.

4. A pop-up will accure warning you of a **Non-Genuine MongoDB Detected**. This is expected, click **Confirm**.
    - This happens because we are using a MongoDB database that is hosted by Azure and not MongoDB.
5. The connection should be acquired and you should now be able to see the database labeled `test` or something else if the name has been changed. You can expand this to see the three collections inside.

Once you are able to connect to the database with MongoDB Compass you can click on the individual collections and view all their contents. From there you are also able to add, edit and delete documents. Next to the `ADD DATA` button is the `EXPORT DATA` option which will allow you to export the full collection of documents to either JSON or CSV format.

## Firewall
The Cosmos DB service has a firewall enabled by default. During testing we have opened up the firewall to all IP addresses however once real data is ready to be collected the firewall should be closed back off to only allow internal Azure services to access it. To do so go to the Azure dashboard and find the Cosmos DB service labeled `rds-pit-app`. From there go into `Networking` and at the bottom of the page delete the rule named `AllowAll_...`. Once done click `Save` at the top of the page.