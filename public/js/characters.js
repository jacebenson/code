var characters = (function(){
    var returnObj = {};
    returnObj.users = [
        //The Expanse
        "Jim Holden",
        "Naomi Nagata",
        "Amos Burton",
        "Alex Kamal",
        "Bobbie Draper",
        //Old Mans War
        "John Perry",
        "Jane Sagan",
        "Hickory",
        "Dickory",
        "Savitri Guntupalli",
        "Zoë Boutin Perry",
        //Magic 2.0
        "Martin",
        "Phillip",
        "Jimmy",
        "Eddie",
        "Gary",
        "Tyler",
        "Jeff",
        "Roy",
        "Gwen",
        "Brit",
        "Ida",
        //Red Rising
        "Darrow",
        "Mustang",
        "Cassius",
        "Sevro",
        //Critical Failures
        "Tim",
        "Stacy",
        "Julian",
        "Cooper",
        "Mordred",
        "Katherine",
        "Dave",
        "Chaz",
        //Enders Game
        "Ender",
        "Peter Wiggin",
        "Valentine Wiggin",
        "Bean",
        "Crazy Tom",
        "Dink Meeker",
        "Alai",
        "Carn Carby",
        "Dumper",
        "Fly Molo",
        "Han Tzu(Hot Soup)",
        "Petra Arkanian",
        "Shen",
        "Vlad",
        "Rooter",
        "Mandachuva",
        "Leaf-eater",
        "Human",
        "Star-looker",
        "Warmaker",
        "Planter",
        "Grass",
        "Fire-quencher",
        "Arrow",
        "Jane",
        "Poke",
      ];
      returnObj.randomUser = function(){
        return returnObj.users[returnObj.random()];
      }
      returnObj.random = function(){
        return Math.round(Math.random() * (returnObj.users.length-1));
      }
      returnObj.randomWord = function(length) {
        var consonants = 'bcdfghjklmnpqrstvwxyz',
            vowels = 'aeiou',
            rand = function(limit) {
                return Math.floor(Math.random()*limit);
            },
            i, word='', length = parseInt(length,10),
            consonants = consonants.split(''),
            vowels = vowels.split('');
        for (i=0;i<length/2;i++) {
            var randConsonant = consonants[rand(consonants.length)],
                randVowel = vowels[rand(vowels.length)];
            word += (i===0) ? randConsonant.toUpperCase() : randConsonant;
            word += i*2<length-1 ? randVowel : '';
        }
        return word;
    }
     
      return returnObj;
})()