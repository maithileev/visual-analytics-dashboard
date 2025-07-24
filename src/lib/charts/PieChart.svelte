     <!-- <script lang="ts">
      import * as d3 from 'd3';
    
      export let summaryData: {
        overview: Record<string, number>;
        region?: Record<string, number>;
      };
    
      export let label: string = 'Superhost KPI';
    
      let svg: SVGSVGElement;
      let tooltip: HTMLDivElement;
    
      let centerLabel = ' Superhost';
      let centerOvPercent = 0;
      let centerRegPercent: number | null = null;
      let centerDiff: number | null = null;
    
      const objToArray = (obj: Record<string, number>) =>
        Object.entries(obj).map(([label, value]) => ({ label, value }));
    
      $: allLabels = Array.from(
        new Set([
          ...Object.keys(summaryData.overview),
          ...(summaryData.region ? Object.keys(summaryData.region) : []),
        ])
      );
    
      $: if (summaryData?.overview) {
        const width = 260;
        const height = 200;
        const radius = Math.min(width, height) / 2 - 16;
    
        d3.select(svg).selectAll('*').remove();
    
        const svgSelection = d3
          .select(svg)
          .attr('width', width)
          .attr('height', height)
          .attr('viewBox', `0 0 ${width} ${height}`)
          .append('g')
          .attr('transform', `translate(${width / 2}, ${height / 2})`);
    
        const color = d3
          .scaleOrdinal<string>()
          .domain(allLabels)
          .range(['#2563eb', '#22c55e']); // Blue and Green
    
        const pie = d3
          .pie<{ label: string; value: number }>()
          .sort(null)
          .value((d) => d.value);
    
        const arcOverview = d3
          .arc<d3.PieArcDatum<{ label: string; value: number }>>()
          .innerRadius(0)
          .outerRadius(radius * 0.7);
    
        const arcRegion = d3
          .arc<d3.PieArcDatum<{ label: string; value: number }>>()
          .innerRadius(radius * 0.75)
          .outerRadius(radius * 0.95);
    
        const overviewData = objToArray(summaryData.overview);
        const totalOverview = d3.sum(overviewData, (d) => d.value);
        const regionData = summaryData.region ? objToArray(summaryData.region) : null;
        const totalRegion = regionData ? d3.sum(regionData, (d) => d.value) : null;
    
        function setCenterData(label: string) {
          centerLabel = label;
          const ovVal = summaryData.overview[label] ?? 0;
          centerOvPercent = totalOverview ? (ovVal / totalOverview) * 100 : 0;
    
          if (summaryData.region && totalRegion) {
            const regVal = summaryData.region[label] ?? 0;
            centerRegPercent = (regVal / totalRegion) * 100;
            centerDiff = centerRegPercent - centerOvPercent;
          } else {
            centerRegPercent = null;
            centerDiff = null;
          }
        }
    
        setCenterData(
          'Superhost' in summaryData.overview ? 'Superhost' : overviewData[0].label
        );
    
        svgSelection
          .selectAll('.arc-overview')
          .data(pie(overviewData))
          .enter()
          .append('path')
          .attr('fill', (d) => color(d.data.label))
          .attr('d', arcOverview)
          .style('cursor', 'pointer')
          .on('mouseover', (event, d) => {
            const percent = ((d.data.value / totalOverview) * 100).toFixed(1);
            tooltip.style.opacity = '1';
            tooltip.innerHTML = `<strong>${d.data.label}</strong>: ${percent}% (${d.data.value})`;
            const bounds = svg.getBoundingClientRect();
            tooltip.style.left = event.clientX - bounds.left + 10 + 'px';
            tooltip.style.top = event.clientY - bounds.top - 30 + 'px';
          })
          .on('mousemove', (event) => {
            const bounds = svg.getBoundingClientRect();
            tooltip.style.left = event.clientX - bounds.left + 10 + 'px';
            tooltip.style.top = event.clientY - bounds.top - 30 + 'px';
          })
          .on('mouseout', () => {
            tooltip.style.opacity = '0';
          })
          .on('click', (_, d) => {
            setCenterData(d.data.label);
          });
    
        if (regionData) {
          svgSelection
            .selectAll('.arc-region')
            .data(pie(regionData))
            .enter()
            .append('path')
            .attr('fill', (d) => color(d.data.label))
            .attr('d', arcRegion)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
              const percent = ((d.data.value / totalRegion!) * 100).toFixed(1);
              tooltip.style.opacity = '1';
              tooltip.innerHTML = `<strong>${d.data.label}</strong>: ${percent}% (${d.data.value})`;
              const bounds = svg.getBoundingClientRect();
              tooltip.style.left = event.clientX - bounds.left + 10 + 'px';
              tooltip.style.top = event.clientY - bounds.top - 30 + 'px';
            })
            .on('mousemove', (event) => {
              const bounds = svg.getBoundingClientRect();
              tooltip.style.left = event.clientX - bounds.left + 10 + 'px';
              tooltip.style.top = event.clientY - bounds.top - 30 + 'px';
            })
            .on('mouseout', () => {
              tooltip.style.opacity = '0';
            })
            .on('click', (_, d) => {
              setCenterData(d.data.label);
            });
        }
      }
    </script>
    
    <style>
      .kpi-card {
        width: 235px;
        background: white;
        padding: 1.5rem;
        border-radius: 0.8rem;
        box-shadow: 0 4px 10px rgb(0 0 0 / 0.05);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #222;
        user-select: none;
      }
    
      .kpi-label {
        font-size: 1.2rem;
        font-weight: 700;
        margin: 0 0 0.6rem 0;
        color: #333;
        text-align: center;
      }
    
      .wrapper {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 0;
        min-height: 200px;
      }
    
      svg {
        display: block;
      }
    
      .center-info {
        display: block;
        flex-direction: column;
        align-items: center; /* centers horizontally */
        justify-content: center;
        margin-top: 0.1rem;
        gap: 0.15rem; /* tight spacing between lines */
        text-align: center;
        font-weight: 600;
        color: #000;
        font-size: 0.95rem;
        user-select: none;
      }
    
      .tooltip {
        position: absolute;
        background-color: white;
        border: 1px solid #ccc;
        padding: 6px 10px;
        font-size: 0.85rem;
        pointer-events: none;
        border-radius: 4px;
        box-shadow: 0 0 6px rgba(0, 0, 0, 0.15);
        opacity: 0;
        transition: opacity 0.2s ease;
        user-select: none;
        white-space: nowrap;
        z-index: 10;
      }
    </style>
    
    <div class="kpi-card">
      <h3 class="kpi-label">{label}</h3>
      <div class="wrapper">
        <svg bind:this={svg}></svg>
        <div class="tooltip" bind:this={tooltip}></div>
      </div>
      <div class="center-info">
        {centerLabel}<br />
        Ov: {centerOvPercent.toFixed(1)}%
        {#if centerRegPercent !== null}
          <br />
          Reg: {centerRegPercent.toFixed(1)}% ({centerDiff! >= 0 ? '+' : ''}{centerDiff!.toFixed(1)}%)
        {/if}
      </div>
    </div>
         -->


         <script lang="ts">
          import * as d3 from 'd3';
        
          export let summaryData: {
            overview: Record<string, number>;
            region?: Record<string, number>;
          };
        
          export let label: string = 'Superhost KPI';
        
          let svg: SVGSVGElement;
          let tooltip: HTMLDivElement;
        
          let centerLabel = 'Superhost';
          let centerOvPercent = 0;
          let centerRegPercent: number | null = null;
          let centerDiff: number | null = null;
        
          let selectedLabel = centerLabel;
        
          const objToArray = (obj: Record<string, number>) =>
            Object.entries(obj).map(([label, value]) => ({ label, value }));
        
          $: allLabels = Array.from(
            new Set([
              ...Object.keys(summaryData.overview),
              ...(summaryData.region ? Object.keys(summaryData.region) : []),
            ])
          );
        
          $: if (summaryData?.overview) {
            const width = 260;
            const height = 200;
            const radius = Math.min(width, height) / 2 - 16;
        
            d3.select(svg).selectAll('*').remove();
        
            const svgSelection = d3
              .select(svg)
              .attr('width', width)
              .attr('height', height)
              .attr('viewBox', `0 0 ${width} ${height}`)
              .append('g')
              .attr('transform', `translate(${width / 2}, ${height / 2})`);
        
            const color = d3
              .scaleOrdinal<string>()
              .domain(allLabels)
              .range(['#2563eb', '#22c55e']);
        
            const pie = d3
              .pie<{ label: string; value: number }>()
              .sort(null)
              .value((d) => d.value);
        
            const arcOverview = d3
              .arc<d3.PieArcDatum<{ label: string; value: number }>>()
              .innerRadius(0)
              .outerRadius(radius * 0.7);
        
            const arcRegion = d3
              .arc<d3.PieArcDatum<{ label: string; value: number }>>()
              .innerRadius(radius * 0.75)
              .outerRadius(radius * 0.95);
        
            const overviewData = objToArray(summaryData.overview);
            const totalOverview = d3.sum(overviewData, (d) => d.value);
            const regionData = summaryData.region ? objToArray(summaryData.region) : null;
            const totalRegion = regionData ? d3.sum(regionData, (d) => d.value) : null;
        
            function updateSelection() {
  svgSelection.selectAll<SVGPathElement, d3.PieArcDatum<{ label: string; value: number }>>('.arc-segment')
    .each(function (d) {
      const path = d3.select(this);
      if (d.data.label === selectedLabel) {
        path.attr('stroke', '#000').attr('stroke-width', 2);
      } else {
        path.attr('stroke', 'none').attr('stroke-width', 0);
      }
    });
}
        
            function setCenterData(label: string) {
              centerLabel = label;
              selectedLabel = label;
              const ovVal = summaryData.overview[label] ?? 0;
              centerOvPercent = totalOverview ? (ovVal / totalOverview) * 100 : 0;
        
              if (summaryData.region && totalRegion) {
                const regVal = summaryData.region[label] ?? 0;
                centerRegPercent = (regVal / totalRegion) * 100;
                centerDiff = centerRegPercent - centerOvPercent;
              } else {
                centerRegPercent = null;
                centerDiff = null;
              }
              updateSelection();
            }
        
            setCenterData('Superhost' in summaryData.overview ? 'Superhost' : overviewData[0].label);
        
            // OVERVIEW arcs
            svgSelection
              .selectAll('.arc-overview')
              .data(pie(overviewData))
              .enter()
              .append('path')
              .attr('class', 'arc-segment arc-overview')
              .attr('fill', (d) => color(d.data.label))
              .attr('d', arcOverview)
              .style('cursor', 'pointer')
              .on('mouseover', (event, d) => {
                const percent = ((d.data.value / totalOverview) * 100).toFixed(1);
                tooltip.style.opacity = '1';
                tooltip.innerHTML = `<strong>${d.data.label}</strong>: ${percent}% (${d.data.value})`;
                const bounds = svg.getBoundingClientRect();
                tooltip.style.left = event.clientX - bounds.left + 10 + 'px';
                tooltip.style.top = event.clientY - bounds.top - 30 + 'px';
              })
              .on('mousemove', (event) => {
                const bounds = svg.getBoundingClientRect();
                tooltip.style.left = event.clientX - bounds.left + 10 + 'px';
                tooltip.style.top = event.clientY - bounds.top - 30 + 'px';
              })
              .on('mouseout', () => {
                tooltip.style.opacity = '0';
              })
              .on('click', (_, d) => {
                setCenterData(d.data.label);
              });
        
            if (regionData) {
              svgSelection
                .selectAll('.arc-region')
                .data(pie(regionData))
                .enter()
                .append('path')
                .attr('class', 'arc-segment arc-region')
                .attr('fill', (d) => color(d.data.label))
                .attr('d', arcRegion)
                .style('cursor', 'pointer')
                .on('mouseover', (event, d) => {
                  const percent = ((d.data.value / totalRegion!) * 100).toFixed(1);
                  tooltip.style.opacity = '1';
                  tooltip.innerHTML = `<strong>${d.data.label}</strong>: ${percent}% (${d.data.value})`;
                  const bounds = svg.getBoundingClientRect();
                  tooltip.style.left = event.clientX - bounds.left + 10 + 'px';
                  tooltip.style.top = event.clientY - bounds.top - 30 + 'px';
                })
                .on('mousemove', (event) => {
                  const bounds = svg.getBoundingClientRect();
                  tooltip.style.left = event.clientX - bounds.left + 10 + 'px';
                  tooltip.style.top = event.clientY - bounds.top - 30 + 'px';
                })
                .on('mouseout', () => {
                  tooltip.style.opacity = '0';
                })
                .on('click', (_, d) => {
                  setCenterData(d.data.label);
                });
            }
        
            updateSelection(); // Ensure initial highlight
          }
        </script>
                        
        <style>
          .kpi-card {
            width: 235px;
            background: white;
            padding: 1.5rem;
            border-radius: 0.8rem;
            box-shadow: 0 4px 10px rgb(0 0 0 / 0.05);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #222;
            user-select: none;
          }
        
          .kpi-label {
            font-size: 1.2rem;
            font-weight: 700;
            margin: 0 0 0.6rem 0;
            color: #333;
            text-align: center;
          }
        
          .wrapper {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 0;
            min-height: 200px;
          }
        
          svg {
            display: block;
          }
        
          .center-info {
            display: block;
            flex-direction: column;
            align-items: center; /* centers horizontally */
            justify-content: center;
            margin-top: 0.1rem;
            gap: 0.15rem; /* tight spacing between lines */
            text-align: center;
            font-weight: 600;
            color: #000;
            font-size: 0.95rem;
            user-select: none;
          }
        
          .tooltip {
            position: absolute;
            background-color: white;
            border: 1px solid #ccc;
            padding: 6px 10px;
            font-size: 0.85rem;
            pointer-events: none;
            border-radius: 4px;
            box-shadow: 0 0 6px rgba(0, 0, 0, 0.15);
            opacity: 0;
            transition: opacity 0.2s ease;
            user-select: none;
            white-space: nowrap;
            z-index: 10;
          }
        </style>
        
        <div class="kpi-card">
          <h3 class="kpi-label">{label}</h3>
          <div class="wrapper">
            <svg bind:this={svg}></svg>
            <div class="tooltip" bind:this={tooltip}></div>
          </div>
          <div class="center-info">
            {centerLabel}<br />
            Ov: {centerOvPercent.toFixed(1)}%
            {#if centerRegPercent !== null}
              <br />
              Reg: {centerRegPercent.toFixed(1)}% ({centerDiff! >= 0 ? '+' : ''}{centerDiff!.toFixed(1)}%)
            {/if}
          </div>
        </div>
        