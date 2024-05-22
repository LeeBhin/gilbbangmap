import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/app/components/Map'), {
  ssr: false,
});

function HomePage(): JSX.Element {
  return (
    <>
      <Map />
    </>
  );
}

export default HomePage;