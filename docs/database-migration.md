# Database Export from MongoDB Atlas

mongoexport --uri "mongodb+srv://<username>:<password>@<host>/<dbname>" --collection=surveys --out <filepath>/
<host>-surveys.json

mongoexport --uri "mongodb+srv://<username>:<password>@<host>/<dbname>" --collection=users --out <filepath>/
<host>-users.json

# Database Import to MongoDB Atlas

mongoimport --uri "mongodb+srv://<username>:<password>@<host>/<dbname>" --collection=surveys --file <filepath>-surveys.json

mongoimport --uri "mongodb+srv://<username>:<password>@<host>/<dbname>" --collection=users --file <filepath>-users.json
