//Dependencies
const express = require('express'),
      cheerio = require('cheerio'),
      rp = require('request-promise'),
      router = express.Router(),
      db = require('../models');

//route to scrape new articles
router.get("/newArticles", function(req, res) {
  //configuring options object for request-promist
  const options = {
    uri: 'http://blog.counter-strike.net/index.php/category/updates/',
    transform: function (body) {
        return cheerio.load(body);
    }
  };
  //calling the database to return all saved articles
  db.Article
    .find({})
    .then((savedArticles) => {
      //creating an array of saved article headlines
      let savedHeadlines = savedArticles.map(article => article.headline);

        //calling request promist with options object
        rp(options)
        .then(function ($) {
          let newArticleArr = [];
          //iterating over returned articles, and creating a newArticle object from the data
          $('.inner_post').each((i, element) => {
            let newArticle = new db.Article({
              storyUrl: $(element).find('h2>a').attr('href'),
              headline: $(element).find('a').text().trim(),
              imgUrl  : $(element).find('img').attr('src'),
              summary : $(element).find('p').html()
            });
            //checking to make sure newArticle contains a storyUrl
            if (newArticle.storyUrl) {
              //checking if new article matches any saved article, if not add it to array
              //of new articles
              if (!savedHeadlines.includes(newArticle.headline)) {
                newArticleArr.push(newArticle);
              }
            }
          });//end of each function

          //adding all new articles to database
          db.Article
            .create(newArticleArr)
            .then(result => res.json({count: newArticleArr.length}))//returning count of new articles to front end
            .catch(err => {});
        })
        .catch(err => console.log(err)); //end of rp method
    })
    .catch(err => console.log(err)); //end of db.Article.find()
});// end of get request to /scrape

module.exports = router;
