// To load and execute the connect-and-insert.js file, 
// use mongosh to connect to your deployment and run the following command:

// load( "connect-and-insert.js" )


//db = connect('mongodb+srv://<username>:<password>@cluster0.mbjniek.mongodb.net/');

// local database connection
db = connect('mongodb://mongouser:mongouser@localhost:27017/moviesdb?authSource=admin');

// Switch to database and insert records
//use moviesdb;

db.createCollection('movies');

db.movies.insertMany([
  { title: "Inception", director: "Nolan", releaseYear: 2010, genres: ["Sci-Fi", "Action"] },
  { title: "Metropolis", director: "Lang", releaseYear: 1927, genres: ["Sci-Fi"] },
  { title: "Interstellar", director: "Nolan", releaseYear: 2014, genres: ["Sci-Fi", "Drama"] }
])


// Fetch all movies released after the year 2000
db.movies.find({ releaseYear: { $gt: 2000 } })


// Update the genre of "Inception" to include "Psychological Thriller"
db.Movies.updateOne(
  { title: "Inception" },
  { $set: { genres: ["Sci-Fi", "Action", "Psychological Thriller"] } }
)

// Delete any classic film released before the year 2000
db.Movies.deleteMany({ releaseYear: { $lt: 2000 } })

// Confirm the updates and deletions worked seamlessly
db.Movies.find().pretty()

db.movies.updateMany({releaseYear: {$type: "number"}},[{$set: {releaseYear: {$toString: "$releaseYear"}}}]);
