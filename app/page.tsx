import dynamic from 'next/dynamic';

const MapWithNoSSR = dynamic(() => import('@/app/components/Map'), {
  ssr: false,
});

function HomePage(): JSX.Element {
  return (
    <div className="homePage">
      <MapWithNoSSR />
    </div>
  );
}

export default HomePage;