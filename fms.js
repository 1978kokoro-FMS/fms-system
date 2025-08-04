const { useState, useEffect } = React;
const { Search, Database, Settings, AlertTriangle, Calendar, MapPin, Building, Zap, Droplets, Shield } = lucideReact;

// 전역 변수로 데이터 저장 (React 상태 문제 회피)
let globalCSVData = [];
let isDataLoaded = false;

const FMSSystem = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadStatus, setLoadStatus] = useState('loading');
  const [dataCount, setDataCount] = useState(0);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (!isDataLoaded) {
      loadCSVData();
    }
  }, []);

  const loadCSVData = async () => {
    try {
      console.log('📊 CSV 데이터 로딩 시작...');
      setLoadStatus('loading');
      
      const response = await fetch('./data.csv');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const csvText = await response.text();
      console.log('📄 CSV 텍스트 길이:', csvText.length);
      
      // 간단한 CSV 파싱
      const lines = csvText.split('\n').filter(line => line.trim());
      console.log('📋 총 라인 수:', lines.length);
      
      if (lines.length < 2) {
        throw new Error('CSV 파일이 비어있습니다');
      }
      
      // 헤더 추출
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      console.log('🏷️ 헤더:', headers);
      
      // 데이터 파싱
      globalCSVData = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
        
        if (values.length >= 10) { // 최소 10개 컬럼이 있는 경우만
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          
          // 유효한 데이터인지 확인
          if (row[headers[0]] || row[headers[1]] || row[headers[2]]) {
            globalCSVData.push(row);
          }
        }
      }
      
      console.log('✅ 파싱 완료! 총', globalCSVData.length, '개 데이터');
      console.log('🔍 첫 번째 데이터:', globalCSVData[0]);
      
      // 상태 업데이트
      setDataCount(globalCSVData.length);
      setLoadStatus('success');
      isDataLoaded = true;
      
      // 전역 접근 가능하도록 설정
      window.csvData = globalCSVData;
      
    } catch (error) {
      console.error('❌ CSV 로드 오류:', error);
      setLoadStatus('error');
      setDataCount(0);
    }
  };

  // 검색 함수
  const handleSearch = () => {
    const term = searchTerm.trim().toLowerCase();
    
    if (!term) {
      setSearchResults([]);
      return;
    }
    
    console.log('🔍 검색 시작:', term);
    console.log('📊 사용 가능한 데이터:', globalCSVData.length, '개');
    
    setIsLoading(true);
    
    try {
      // 검색 실행
      const results = globalCSVData.filter(row => {
        const searchFields = Object.values(row).join(' ').toLowerCase();
        return searchFields.includes(term);
      });
      
      console.log('📋 검색 결과:', results.length, '개');
      
      // 결과 포맷팅
      const formattedResults = results.slice(0, 20).map((row, index) => {
        const headers = Object.keys(row);
        return {
          id: index,
          code: row[headers[0]] || row[headers[1]] || 'N/A',
          name: row[headers[2]] || row[headers[1]] || 'N/A', 
          facility: row[headers[3]] || 'N/A',
          location: row[headers[5]] || 'N/A',
          installDate: row[headers[4]] || 'N/A',
          durability: row[headers[6]] || 'N/A',
          specs: row[headers[7]] || 'N/A',
          checkCycle: row[headers[8]] || 'N/A',
          quantity: row[headers[9]] || 'N/A',
          rawData: row // 디버깅용
        };
      });
      
      setSearchResults(formattedResults);
      console.log('✅ 포맷된 결과:', formattedResults);
      
    } catch (error) {
      console.error('❌ 검색 오류:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Enter 키 처리
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 아이콘 선택
  const getIcon = (code) => {
    const c = code.toString().toUpperCase();
    if (c.includes('EL')) return React.createElement(Zap, { className: "h-4 w-4 text-yellow-600" });
    if (c.includes('BO')) return React.createElement(Settings, { className: "h-4 w-4 text-blue-600" });
    if (c.includes('SF')) return React.createElement(Shield, { className: "h-4 w-4 text-red-600" });
    return React.createElement(Database, { className: "h-4 w-4 text-gray-600" });
  };

  // 상태 표시
  const getStatusDisplay = () => {
    if (loadStatus === 'success') {
      return React.createElement('div', { className: "bg-green-50 border border-green-200 rounded-lg p-3" },
        React.createElement('div', { className: "flex items-center gap-2" },
          React.createElement('div', { className: "w-2 h-2 bg-green-500 rounded-full" }),
          React.createElement('span', { className: "text-green-700 font-medium" }, `✅ CSV 데이터 로드 성공! (총 ${dataCount}개)`)
        )
      );
    } else if (loadStatus === 'error') {
      return React.createElement('div', { className: "bg-red-50 border border-red-200 rounded-lg p-3" },
        React.createElement('div', { className: "flex items-center gap-2" },
          React.createElement(AlertTriangle, { className: "h-4 w-4 text-red-500" }),
          React.createElement('span', { className: "text-red-700" }, '❌ 데이터 로드 실패'),
          React.createElement('button', { 
            onClick: loadCSVData,
            className: "ml-2 text-red-600 underline"
          }, '재시도')
        )
      );
    } else {
      return React.createElement('div', { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-3" },
        React.createElement('div', { className: "flex items-center gap-2" },
          React.createElement('div', { className: "w-2 h-2 bg-yellow-500 rounded-full animate-spin" }),
          React.createElement('span', { className: "text-yellow-700" }, '⏳ CSV 데이터 로딩 중...')
        )
      );
    }
  };

  return React.createElement('div', { className: "max-w-6xl mx-auto p-6 bg-white min-h-screen" },
    // 헤더
    React.createElement('div', { className: "mb-8" },
      React.createElement('div', { className: "flex items-center gap-3 mb-4" },
        React.createElement('div', { className: "bg-blue-600 p-2 rounded-lg" },
          React.createElement(Database, { className: "h-6 w-6 text-white" })
        ),
        React.createElement('div', null,
          React.createElement('h1', { className: "text-2xl font-bold text-gray-900" }, '🔗 노성 연동 FMS 시설물 관리시스템'),
          React.createElement('p', { className: "text-gray-600" }, '실시간 CSV 데이터 연동 • 스마트 설비 검색 • 통합 관리')
        )
      ),
      getStatusDisplay()
    ),
    
    // 검색 섹션
    React.createElement('div', { className: "space-y-6" },
      React.createElement('div', { className: "bg-gray-50 rounded-lg p-6" },
        React.createElement('h2', { className: "text-lg font-semibold mb-4 flex items-center gap-2" },
          React.createElement(Search, { className: "h-5 w-5" }),
          '🔍 노성 설비 검색'
        ),
        React.createElement('div', { className: "flex gap-2 mb-3" },
          React.createElement('input', {
            type: "text",
            placeholder: "아무 키워드나 입력하세요 (예: SC01, 보일러, 지하1층)",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            onKeyPress: handleKeyPress,
            className: "flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500",
            disabled: isLoading || dataCount === 0
          }),
          React.createElement('button', {
            onClick: handleSearch,
            disabled: isLoading || dataCount === 0,
            className: "px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          },
            isLoading ? '🔄 검색중...' : '🔍 검색'
          )
        ),
        React.createElement('div', { className: "flex gap-2" },
          React.createElement('button', {
            onClick: () => { setSearchTerm('SC01'); handleSearch(); },
            className: "px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
          }, 'SC01'),
          React.createElement('button', {
            onClick: () => { setSearchTerm('보일러'); handleSearch(); },
            className: "px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
          }, '보일러'),
          React.createElement('button', {
            onClick: () => { setSearchTerm('지하'); handleSearch(); },
            className: "px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
          }, '지하')
        )
      ),
      
      // 검색 결과
      searchResults.length > 0 && React.createElement('div', null,
        React.createElement('h3', { className: "text-lg font-semibold mb-4" }, `📋 검색 결과 (${searchResults.length}건)`),
        React.createElement('div', { className: "space-y-4" },
          searchResults.map((item) =>
            React.createElement('div', { key: item.id, className: "bg-white border rounded-lg p-4 shadow-sm" },
              React.createElement('div', { className: "flex items-start justify-between" },
                React.createElement('div', { className: "flex-1" },
                  React.createElement('div', { className: "flex items-center gap-2 mb-2" },
                    getIcon(item.code),
                    React.createElement('span', { className: "font-mono font-bold text-blue-600" }, item.code),
                    React.createElement('span', { className: "px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded" }, '설비')
                  ),
                  React.createElement('h4', { className: "font-semibold text-lg mb-2" }, item.name),
                  React.createElement('div', { className: "grid grid-cols-2 gap-3 text-sm text-gray-600" },
                    React.createElement('div', null, '🏢 시설: ', item.facility),
                    React.createElement('div', null, '📍 위치: ', item.location),
                    React.createElement('div', null, '📅 설치: ', item.installDate),
                    React.createElement('div', null, '🔧 규격: ', item.specs)
                  )
                )
              )
            )
          )
        )
      ),
      
      // 검색 결과 없음
      searchTerm && !isLoading && searchResults.length === 0 && dataCount > 0 && 
        React.createElement('div', { className: "text-center py-8 text-gray-500" },
          React.createElement('p', null, '❌ 검색 결과가 없습니다'),
          React.createElement('p', { className: "text-sm mt-2" }, '다른 키워드로 검색해보세요')
        )
    )
  );
};

ReactDOM.render(React.createElement(FMSSystem), document.getElementById('root'));
