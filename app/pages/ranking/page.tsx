'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Doughnut } from 'react-chartjs-2';
import 'chart.js/auto';

export default function Ranking() {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Agree Count',
        data: [],
        backgroundColor: [],
      },
    ],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('smoke_zones')
          .select('name, agree_count')
          .order('agree_count', { ascending: false });

        if (error) {
          console.error('Error fetching data:', error);
          return;
        }

        if (data) {
          const labels = data.map((item) => item.name);
          const agreeCounts = data.map((item) => item.agree_count);
          const backgroundColors = data.map(
            (_, index) => `hsl(${index * 30}, 70%, 50%)`
          );

          setChartData({
            labels,
            datasets: [
              {
                label: 'Agree Count',
                data: agreeCounts,
                backgroundColor: backgroundColors,
              },
            ],
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="map">
      <div style={{ width: '50%', margin: '0 auto' }}>
        <Doughnut data={chartData} />
      </div>
    </div>
  );
}
