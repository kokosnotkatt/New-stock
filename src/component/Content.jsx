
import BannerSlider from './BannerSlider';
import NewsList from './NewsList';

const Content = () => {
  const handleNewsClick = (article) => {
    console.log('Navigating to news:', article.title);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col space-y-8"> 
        <BannerSlider />
        <NewsList onNewsClick={handleNewsClick} />
      </div>
    </div>
  );
};

export default Content;