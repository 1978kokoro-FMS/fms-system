const { useState, useEffect } = React;
const { Search, Database, Settings, AlertTriangle, Calendar, MapPin, Building, Zap, Droplets, Shield } = lucideReact;

let globalCSVData = [];
let rawCSVText = '';

const FMSSystem = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadStatus, setLoadStatus] = useState('loading');
  const [dataCount, setDataCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    loadCSVData();
  }, []);

  const loadCSVData = async () => {
    try {
      console.log('🚀 CSV 로딩 시작...');
      setLoadStatus('loading');
      setDebugInfo('CSV 파일 요청 중...');
      
      const response = await fetch('./data.csv');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      rawCSVText = await response.text();
      console.log('📄 CSV 텍스트 길이:', rawCSVText.length);
      console.log('📄 첫 200자:', rawCSVText.substring(0, 200));
      
      if (rawCSVText.length < 100) {
        throw new Error('CSV 파일이 너무 작습니다');
      }
      
      // 매우 관대한 라인 분할
      let lines = rawCSVText.split('\n');
      lines = lines.filter(line => line.trim().length > 10); // 10자 이상인 라인만
      
      console.log('📋 유효한 라인 수:', lines.length);
      console.log('📋 첫 번째 라인:', lines[0]);
      console.log('📋 두 번째 라인:', lines[1]);
      
      if (lines.length < 2) {
        throw new Error('유효한 데이터 라인이 없습니다');
      }
      
      // 헤더 추출 (매우 관대하게)
      const headerLine = lines[0];
      let headers = [];
      
      // 콤마로 분할 시도
      if (headerLine.includes(',')) {
        headers = headerLine.split(',').map(h => h.replace(/"/g, '').trim());
      } else if (headerLine.includes('\t')) {
        headers = headerLine.split('\t').map(h => h.replace(/"/g, '').trim());
      } else {
        headers = ['컬럼1', '컬럼2', '컬럼3', '컬럼4', '컬럼5']; // 기본 헤더
      }
      
      console.log('🏷️ 헤더 개수:', headers.length);
      console.log('🏷️ 헤더:', headers.slice(0, 10)); // 처음 10개만 표시
      
      // 데이터 파싱 (극도로 관대하게)
      globalCSVData = [];
      
      for (let i = 1; i < lines.length && i < 1000; i++) { // 최대 1000개만 처리
        const line = lines[i].trim();
        if (line.length < 5) continue; // 너무 짧은 라인 건너뛰기
        
        let values = [];
        
        // 구분자 감지 및 분할
        if (line.includes(',')) {
          values = line.split(',');
        } else if (line.includes('\t')) {
          values = line.split('\t');
        } else {
          values = [line]; // 단일 값으로 처리
        }
        
        // 값 정리
        values = values.map(v => v.replace(/"/g, '').trim());
        
        // 최소 3개 이상의 값이 있는 경우만 처리
        if (values.length >= 3 && values.some(v => v.length > 0)) {
          const row = {};
          
          // 헤더와 값 매핑
          for (let j = 0; j < Math.max(headers.length, values.length); j++) {
            const header = headers[j] || `컬럼${j+1}`;
            const value = values[j] || '';
            row[header] = value;
          }
          
          // 기본 필드 설정
          row._rawLine = line;
          row._lineNumber = i;
          
          globalCSVData.push(row);
        }
      }
      
      console.log('✅ 파싱 완료! 총', globalCSVData.length, '개 데이터');
      console.log('🔍 첫 번째 데이터:', globalCSVData[0]);
      console.log('🔍 두 번째 데이터:', globalCSVData[1]);
      console.log('🔍 마지막 데이터:', globalCSVData[globalCSVData.length - 1]);
      
      setDataCount(globalCSVData.length);
      setLoadStatus('success');
      setDebugInfo(`성공: ${globalCSVData.length}개 데이터 로드`);
      
      // 전역 접근
      window.csvData = globalCSVData;
      window.rawCSV = rawCSVText;
      
    } catch (error) {
      console.error('❌ CSV 로드 오류:', error);
      setLoadStatus('error');
      setDataCount(0);
      setDebugInfo(`오류: ${error.message}`);
    }
  };

  const handleSearch = () => {
    const term = searchTerm.trim().toLowerCase();
    
    if (!term) {
      setSearchResults([]);
      return;
    }
    
    console.log('🔍 검색 시작:', term);
    console.log('📊 검색 대상 데이터:', globalCSVData.length, '개');
    
    setIsLoading(true);
    
    try {
      // 매우 관대한 검색
      const results = globalCSVData.filter(row => {
        // 모든 값을 문자열로 변환해서 검색
        const allText = Object.values(row).join(' ').toLowerCase();
        return allText.includes(term);
      });
      
      console.log('📋 검색 결과:', results.length, '개');
      console.log('📋 첫 번째 결과:', results[0]);
      
      // 결과 포맷팅
      const formattedResults = results.slice(0, 30).map((row, index) => {
        const values = Object.values(row);
        const keys = Object.keys(row);
        
        return {
          id: index,
          code: values[0] || values[1] || `ID-${index}`,
          name: values[1] || values[2] || values[0] || '설비명 없음',
          facility: values[2] || values[3] || '시설명 없음',
          location: values[3] || values[4] || values[5] || '위치 없음',
          details: values.slice(4, 8).filter(v => v).join(', ') || '상세정보 없음',
          rawData: row,
          allText: Object.values(row).join(' | ')
        };
      });
      
      setSearchResults(formattedResults);
      console.log('✅ 포맷된 결과:', formattedResults.length, '개');
      
    } catch (error) {
      console.error('❌ 검색 오류:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getStatusDisplay = () => {
    if (loadStatus === 'success') {
      return React.createElement('div', { className: "bg-green-50 border border-green-200 rounded-lg p-4" },
        React.createElement('div', { className: "flex items-center gap-2 mb-2" },
          React.createElement('div', { className: "w-3 h-3 bg-green-500 rounded-full" }),
          React.createElement('span', { className: "text-green-700 font-bold" }, `✅ CSV 데이터 로드 성공!`)
        ),
        React.createElement('div', { className: "text-sm text-green-600" },
          React.createElement('div', null, `📊 총 ${dataCount}개 데이터 로드 완료`),
          React.createElement('div', null, `📄 CSV 파일 크기: ${rawCSVText.length.toLocaleString()}자`),
          React.createElement('div', null, `🔍 검색 가능 상태`)
        )
      );
    } else if (loadStatus === 'error') {
      return React.createElement('div', { className: "bg-red-50 border border-red-200 rounded-lg p-4" },
        React.createElement('div', { className: "flex items-center gap-2 mb-2" },
          React.createElement(AlertTriangle, { className: "h-5 w-5 text-red-500" }),
          React.createElement('span', { className: "text-red-700 font-bold" }, '❌ 데이터 로드 실패')
        ),
        React.createElement('div', { className: "text-sm text-red-600 mb-2" }, debugInfo),
        React.createElement('button', { 
          onClick: loadCSVData,
          className: "px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        }, '🔄 재시도')
      );
    } else {
      return React.createElement('div', { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4" },
        React.createElement('div', { className: "flex items-center gap-2" },
          React.createElement('div', { className: "w-3 h-3 bg-yellow-500 rounded-full animate-spin" }),
          React.createElement('span', { className: "text-yellow-700 font-bold" }, '⏳ CSV 데이터 로딩 중...')
        ),
        React.createElement('div', { className: "text-sm text-yellow-600 mt-1" }, debugInfo)
      );
    }
  };

  return React.createElement('div', { className: "max-w-6xl mx-auto p-6 bg-white min-h-screen" },
    // 헤더
    React.createElement('div', { className: "mb-8" },
      React.createElement('div', { className: "flex items-center gap-3 mb-4" },
        React.createElement('div', { className: "bg-blue-600 p-3 rounded-lg" },
          React.createElement(Database, { className: "h-7 w-7 text-white" })
        ),
        React.createElement('div', null,
          React.createElement('h1', { className: "text-3xl font-bold text-gray-900" }, '🔗 노성 연동 FMS 시설물 관리시스템'),
          React.createElement('p', { className: "text-gray-600 text-lg" }, '실시간 CSV 데이터 연동 • 스마트 설비 검색 • 통합 관리')
        )
      ),
      getStatusDisplay()
    ),
    
    // 검색 섹션
    React.createElement('div', { className: "space-y-6" },
      React.createElement('div', { className: "bg-gray-50 rounded-lg p-6" },
        React.createElement('h2', { className: "text-xl font-bold mb-4 flex items-center gap-2" },
          React.createElement(Search, { className: "h-6 w-6" }),
          '🔍 전체 데이터 검색'
        ),
        React.createElement('div', { className: "flex gap-3 mb-4" },
          React.createElement('input', {
            type: "text",
            placeholder: "모든 필드에서 검색합니다 (예: SC01, 보일러, 지하1층, 설비명...)",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            onKeyPress: handleKeyPress,
            className: "flex-1 px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            disabled: isLoading || dataCount === 0
          }),
          React.createElement('button', {
            onClick: handleSearch,
            disabled: isLoading || dataCount === 0,
            className: "px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          },
            isLoading ? '🔄 검색중...' : '🔍 검색'
          )
        ),
        React.createElement('div', { className: "flex gap-2 flex-wrap" },
          React.createElement('button', {
            onClick: () => { setSearchTerm('SC01'); setTimeout(handleSearch, 100); },
            className: "px-3 py-2 bg-blue-100 text-blue-700 rounded font-medium hover:bg-blue-200"
          }, 'SC01'),
          React.createElement('button', {
            onClick: () => { setSearchTerm('보일러'); setTimeout(handleSearch, 100); },
            className: "px-3 py-2 bg-green-100 text-green-700 rounded font-medium hover:bg-green-200"
          }, '보일러'),
          React.createElement('button', {
            onClick: () => { setSearchTerm('전기'); setTimeout(handleSearch, 100); },
            className: "px-3 py-2 bg-yellow-100 text-yellow-700 rounded font-medium hover:bg-yellow-200"
          }, '전기'),
          React.createElement('button', {
            onClick: () => { setSearchTerm('지하'); setTimeout(handleSearch, 100); },
            className: "px-3 py-2 bg-purple-100 text-purple-700 rounded font-medium hover:bg-purple-200"
          }, '지하'),
          React.createElement('button', {
            onClick: () => { setSearchTerm('2021'); setTimeout(handleSearch, 100); },
            className: "px-3 py-2 bg-red-100 text-red-700 rounded font-medium hover:bg-red-200"
          }, '2021')
        )
      ),
      
      // 검색 결과
      searchResults.length > 0 && React.createElement('div', null,
        React.createElement('h3', { className: "text-xl font-bold mb-4 text-blue-600" }, 
          `📋 검색 결과 (${searchResults.length}건 표시)`
        ),
        React.createElement('div', { className: "space-y-4" },
          searchResults.map((item) =>
            React.createElement('div', { key: item.id, className: "bg-white border-2 border-gray-200 rounded-lg p-5 hover:shadow-lg hover:border-blue-300 transition-all" },
              React.createElement('div', { className: "flex items-start justify-between mb-3" },
                React.createElement('div', { className: "flex-1" },
                  React.createElement('div', { className: "flex items-center gap-3 mb-3" },
                    React.createElement(Database, { className: "h-5 w-5 text-blue-600" }),
                    React.createElement('span', { className: "font-mono text-lg font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded" }, 
                      item.code
                    ),
                    React.createElement('span', { className: "px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full" }, 
                      '설비'
                    )
                  ),
                  React.createElement('h4', { className: "font-bold text-xl text-gray-900 mb-3" }, item.name),
                  React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3" },
                    React.createElement('div', { className: "flex items-center gap-2" },
                      React.createElement(Building, { className: "h-4 w-4 text-gray-500" }),
                      React.createElement('span', { className: "text-gray-700" }, '시설: '),
                      React.createElement('span', { className: "font-medium" }, item.facility)
                    ),
                    React.createElement('div', { className: "flex items-center gap-2" },
                      React.createElement(MapPin, { className: "h-4 w-4 text-gray-500" }),
                      React.createElement('span', { className: "text-gray-700" }, '위치: '),
                      React.createElement('span', { className: "font-medium" }, item.location)
                    )
                  ),
                  React.createElement('div', { className: "mt-3 p-3 bg-gray-50 rounded text-sm" },
                    React.createElement('div', { className: "font-medium text-gray-700 mb-1" }, '📄 상세정보:'),
                    React.createElement('div', { className: "text-gray-600" }, item.details)
                  ),
                  React.createElement('details', { className: "mt-2" },
                    React.createElement('summary', { className: "cursor-pointer text-xs text-gray-500 hover:text-gray-700" }, 
                      '🔍 원본 데이터 보기'
                    ),
                    React.createElement('div', { className: "mt-2 p-2 bg-gray-100 rounded text-xs font-mono text-gray-600 overflow-x-auto" },
                      item.allText
                    )
                  )
                )
              )
            )
          )
        )
      ),
      
      // 검색 결과 없음
      searchTerm && !isLoading && searchResults.length === 0 && dataCount > 0 && 
        React.createElement('div', { className: "text-center py-12 bg-gray-50 rounded-lg" },
          React.createElement('div', { className: "text-6xl mb-4" }, '🔍'),
          React.createElement('h3', { className: "text-xl font-bold text-gray-600 mb-2" }, '검색 결과가 없습니다'),
          React.createElement('p', { className: "text-gray-500" }, `"${searchTerm}"에 대한 검색 결과를 찾을 수 없습니다`),
          React.createElement('p', { className: "text-sm text-gray-400 mt-2" }, '다른 키워드로 검색해보세요')
        )
    )
  );
};

ReactDOM.render(React.createElement(FMSSystem), document.getElementById('root'));
