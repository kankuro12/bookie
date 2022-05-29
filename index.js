const {bookmakerEvent}=require('./bookmakerevent');
try {
    bookmakerEvent('https://be.bookmaker.eu/en/sports/basketball/nba/nba/boston-celtics-vs-miami-heat/').then((res)=>{
        console.log(res);
    })
    .catch((err)=>{
    
    });
    
} catch (error) {
    console.log(error);
}
