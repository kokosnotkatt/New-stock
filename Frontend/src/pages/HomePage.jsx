import BannerSlider from '../component/Banner/BannerSlider';
import NewsList from '../component/News/NewsList';

const HomePage = () => {
  const handleNewsClick = (article) => {
    console.log('Navigating to news:', article.title);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 bg-gray-200">
      <div className="flex flex-col space-y-8"> 
        <BannerSlider />
        <div className="flex flex-col space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">Latest News</h3>
          
          <NewsList onNewsClick={handleNewsClick} />
        </div>
        
      </div>
    </div>
  );
};

export default HomePage;