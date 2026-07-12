# MongoDB Session

This repository contains queries demonstrated in the session. 

## Script Loading

Change the connection string in the file based on your environment.
To run the script, login to mongosh

```bash
mongosh -u <username> -p
```
Enter the password when prompted.

```bash
test>load('path/to/moviesCrud.js');
```
This will create a movies collection

## CSV Loading
You can use `mongoimport` tool for loading the csv file as JSON docs.

```bash
mongoimport --db=your_database_name --collection=your_collection_name --type=csv --headerline --file=/path/to/your/file.csv
```

# References
1. [MongoDB Tools](https://www.mongodb.com/try/download/database-tools)
2. [MongoSync](https://www.mongodb.com/try/download/mongosync)
3. [MongoDB Docs](https://www.mongodb.com/docs/)
