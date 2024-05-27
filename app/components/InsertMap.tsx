'use client';

import style from '@/app/styles/home.module.css';
import { useEffect, useRef, useState } from 'react';
import { Circle, Marker, Playgon } from '@/public/svgs';
import { supabase } from '@/lib/supabase';
const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;

declare global {
  interface Window {
    kakao: any;
  }
}

const Map: React.FC = () => {
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const drawingManagerRef = useRef<any>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isInputVisible, setIsInputVisible] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string>('');
  const [currentShape, setCurrentShape] = useState<any>(null);
  const [canDraw, setCanDraw] = useState<boolean>(true);
  const [shapeCenter, setShapeCenter] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [savedManager, setSavedManager] = useState<any>(null);
  const [votedItems, setVotedItems] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&libraries=drawing&autoload=false`;
    document.head.appendChild(script);

    script.onload = () => {
      if (!window.kakao) {
        console.error('Kakao map script not loaded');
        return;
      }

      window.kakao.maps.load(() => {
        const container = document.getElementById('map') as HTMLElement;
        const options = {
          center: new window.kakao.maps.LatLng(37.551815, 126.991791),
          level: 7,
        };
        const map = new window.kakao.maps.Map(container, options);
        mapRef.current = map;

        // 줌 컨트롤 추가
        const zoomControl = new window.kakao.maps.ZoomControl();
        map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

        // 지도 타입 컨트롤 추가
        const mapTypeControl = new window.kakao.maps.MapTypeControl();
        map.addControl(mapTypeControl, window.kakao.maps.ControlPosition.TOPRIGHT);

        const drawingOptions = {
          map: map,
          drawingMode: [
            window.kakao.maps.drawing.OverlayType.MARKER,
            window.kakao.maps.drawing.OverlayType.CIRCLE,
            window.kakao.maps.drawing.OverlayType.POLYGON
          ],
          guideTooltip: ['draw', 'drag', 'edit'],
          markerOptions: {
            draggable: false,
            removable: false
          },
          circleOptions: {
            draggable: true,
            removable: false,
            editable: true,
            strokeColor: '#00a0e9',
            fillColor: '#00a0e9',
            fillOpacity: 0.6
          },
          polygonOptions: {
            draggable: true,
            removable: false,
            editable: true,
            strokeColor: '#00a0e9',
            fillColor: '#00a0e9',
            fillOpacity: 0.6,
            hintStrokeStyle: 'dash',
            hintStrokeOpacity: 0.5
          }
        };

        const drawingManager = new window.kakao.maps.drawing.DrawingManager(drawingOptions);
        drawingManagerRef.current = drawingManager;
        setSavedManager(drawingManager);

        const handleDrawEnd = (data: any) => {
          setCurrentShape(data.target);
          setIsDrawing(true);
          setCanDraw(false);

          let center;
          if (data.target.getPosition) {
            center = data.target.getPosition(); // 원의 경우 또는 마커의 경우
          } else if (data.target.getPath) {
            const path = data.target.getPath(); // 다각형의 경우
            let sumLat = 0;
            let sumLng = 0;
            const count = path.length;

            path.forEach((point: any) => {
              const latLng = point.toLatLng(); // 포인트를 위도, 경도로 변환
              sumLat += latLng.getLat();
              sumLng += latLng.getLng();
            });
            center = new window.kakao.maps.LatLng(sumLat / count, sumLng / count);
          }

          // @ts-ignore
          const proj = mapRef.current!.getProjection();
          const point = proj.containerPointFromCoords(center);

          // 마커의 경우 상단으로 조금 올림
          if (data.target.getPosition) {
            setShapeCenter({ x: point.x + 80, y: point.y - 80 });
          } else {
            setShapeCenter({ x: point.x, y: point.y });
          }
        };

        window.kakao.maps.event.addListener(drawingManager, 'drawend', handleDrawEnd);
      });
    };
  }, []);

  const handleStartDrawing = (type: any) => {
    if (drawingManagerRef.current && canDraw) {
      drawingManagerRef.current.select(type);
    }
  };

  const handleConfirm = () => {
    setIsInputVisible(true);
    setIsDrawing(false);
  };

  const handleCancel = () => {
    if (currentShape) {
      if (drawingManagerRef.current) {
        drawingManagerRef.current.cancel();
      }

      currentShape.setMap(null);

      drawingManagerRef.current.remove(currentShape);

      setCurrentShape(null);
      setCanDraw(true);
    }
    setIsDrawing(false);
    setIsInputVisible(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
  };

  const handleSave = async () => {
    if (nickname && savedManager) {
      const data = savedManager.getData();

      for (const [type, shapes] of Object.entries(data)) {
        // @ts-ignore
        if (shapes && shapes.length > 0) {
          // @ts-ignore
          for (const shape of shapes) {
            const shapeData = {
              name: nickname,
              zone_type: type.toLowerCase(),
              coordinates: JSON.stringify(shape),
              status: 'pending',
              agree_count: 0,
              disagree_count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            try {
              const { data, error } = await supabase.from('smoke_zones').insert([shapeData]);
              if (error) {
                console.error('Error saving data:', error);
              } else {
                alert('요청이 완료되었습니다.');
              }
            } catch (error) {
              console.error('Error saving data:', error);
            }
          }
        }
      }

      if (drawingManagerRef.current) {
        drawingManagerRef.current.cancel();
      }

      if (currentShape) {
        currentShape.setMap(null);
        drawingManagerRef.current.remove(currentShape);
      }

      setIsDrawing(false);
      setIsInputVisible(false);
      setNickname('');
      setCurrentShape(null);
      setCanDraw(true);
    }
  };

  const handleVote = async (id: string, isAgree: boolean) => {
    if (votedItems[id]) {
      alert('이미 참여하셨습니다.');
      return;
    }

    const field = isAgree ? 'agree_count' : 'disagree_count';

    try {
      const { data, error } = await supabase
        .from('smoke_zones')
        .select(field)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching vote count:', error);
        return;
      }
      // @ts-ignore
      const currentCount = data[field];
      const newCount = currentCount + 1;
      // @ts-ignore
      const { updateError } = await supabase
        .from('smoke_zones')
        .update({ [field]: newCount })
        .eq('id', id);

      if (updateError) {
        console.error('Error updating vote:', updateError);
      } else {
        setVotedItems({ ...votedItems, [id]: true });
        alert('참여가 완료되었습니다.');

        if (isAgree && newCount >= 10) {
          // @ts-ignore
          const { statusUpdateError } = await supabase
            .from('smoke_zones')
            .update({ status: 'approved' })
            .eq('id', id);

          if (statusUpdateError) {
            console.error('Error updating status to approved:', statusUpdateError);
          } else {
            alert('Zone approved!');
          }
        }
      }
    } catch (error) {
      console.error('Error updating vote:', error);
    }
  };


  const loadPendingShapes = async () => {
    try {
      const { data: shapesData, error } = await supabase
        .from('smoke_zones')
        .select('*')
        .eq('status', 'pending');
      if (error) {
        console.error('Error fetching shapes:', error.message);
        return;
      }

      // shapes를 지도에 표시
      if (shapesData && shapesData.length > 0) {
        const map = mapRef.current;
        if (map) {
          shapesData.forEach((shape: any) => {
            const coordinates = JSON.parse(shape.coordinates);
            // @ts-ignore
            let newShape;

            // Create a container for the info window content
            const infowindowDiv = document.createElement('div');
            infowindowDiv.style.padding = '5px';
            infowindowDiv.innerHTML = `${shape.name}<br />`;

            // Create agree and disagree buttons
            const agreeButton = document.createElement('button');
            agreeButton.innerText = '동의';
            agreeButton.onclick = () => handleVote(shape.id, true);

            const disagreeButton = document.createElement('button');
            disagreeButton.innerText = '비동의';
            disagreeButton.onclick = () => handleVote(shape.id, false);

            // Append buttons to the info window content
            infowindowDiv.appendChild(agreeButton);
            infowindowDiv.appendChild(disagreeButton);

            if (shape.zone_type === 'marker') {
              newShape = new window.kakao.maps.Marker({
                position: new window.kakao.maps.LatLng(coordinates.y, coordinates.x),
                map: map,
                title: shape.name,
              });

              const infowindow = new window.kakao.maps.InfoWindow({
                content: infowindowDiv
              });
              infowindow.open(map, newShape);
            } else if (shape.zone_type === 'circle') {
              newShape = new window.kakao.maps.Circle({
                center: new window.kakao.maps.LatLng(coordinates.center.y, coordinates.center.x),
                radius: coordinates.radius,
                strokeColor: coordinates.options.strokeColor,
                strokeOpacity: coordinates.options.strokeOpacity,
                strokeWeight: coordinates.options.strokeWeight,
                fillColor: coordinates.options.fillColor,
                fillOpacity: coordinates.options.fillOpacity,
                map: map,
              });

              const center = new window.kakao.maps.LatLng(coordinates.center.y, coordinates.center.x);
              const infowindow = new window.kakao.maps.InfoWindow({
                content: infowindowDiv,
                position: center
              });
              infowindow.open(map);

            } else if (shape.zone_type === 'polygon') {
              const path = coordinates.points.map((point: any) => new window.kakao.maps.LatLng(point.y, point.x));
              newShape = new window.kakao.maps.Polygon({
                path: path,
                strokeColor: coordinates.options.strokeColor,
                strokeOpacity: coordinates.options.strokeOpacity,
                strokeWeight: coordinates.options.strokeWeight,
                fillColor: coordinates.options.fillColor,
                fillOpacity: coordinates.options.fillOpacity,
                map: map,
              });

              const infowindow = new window.kakao.maps.InfoWindow({
                content: infowindowDiv,
                position: path[0]
              });
              infowindow.open(map);
            }
          });
        }
      }
    } catch (error) {
      // @ts-ignore
      console.error('Error loading shapes:', error.message);
    }
  };

  useEffect(() => {
    loadPendingShapes();
  }, []);

  return (
    <div className='map'>
      <div id="map" style={{ width: '100%', height: '100%' }}></div>
      <div className={style.btnWrap}>
        <button className={style.btn} onClick={() => handleStartDrawing(window.kakao.maps.drawing.OverlayType.MARKER)} disabled={!canDraw}>
          <Marker />마커
        </button>
        <button className={style.btn} onClick={() => handleStartDrawing(window.kakao.maps.drawing.OverlayType.CIRCLE)} disabled={!canDraw}>
          <Circle />원
        </button>
        <button className={style.btn} onClick={() => handleStartDrawing(window.kakao.maps.drawing.OverlayType.POLYGON)} disabled={!canDraw}>
          <Playgon />다각형
        </button>
      </div>
      {isDrawing && (
        <div className={style.actionButtons} style={{ top: shapeCenter.y, left: shapeCenter.x }}>
          <button className={style.confirmBtn} onClick={handleCancel}>취소</button>
          <button className={style.confirmBtn} onClick={handleConfirm}>확인</button>
        </div>
      )}
      {isInputVisible && (
        <div className={style.inputWrap} style={{ top: shapeCenter.y, left: shapeCenter.x }}>
          <input
            type="text"
            value={nickname}
            onChange={handleInputChange}
            placeholder="추가할 길빵존의 별명을 입력하세요"
            className={style.nicInput}
          />
          <button onClick={handleSave} className={style.nicSubmit}>저장</button>
        </div>
      )}
    </div>
  );
};

export default Map;
