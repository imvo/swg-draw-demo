window.onload = function () {
    var app = new App();
};
var App = function () {
    this.svg = document.getElementsByTagName("svg")[0];
    this.basePoints = this.svg.getElementsByClassName('drag-handler');
    //for coordinates conversion
    this.pt = this.svg.createSVGPoint();

    //to this nodes we will populate data about additional shapes
    this.coordsdata = document.getElementsByClassName('point-coords');
    this.areadata = document.getElementById('figure-area');

    this.init = function () {
        this.registerHandlers();
    };
    this.registerHandlers = function (evt) {
        document.getElementById('reset').addEventListener('click', this.reset.bind(this));
        document.getElementById('help-open').addEventListener('click', this.toggleHidden);
        document.getElementById('help-close').addEventListener('click', this.toggleHidden);
        this.svg.addEventListener('click', this.eventDispatcher.bind(this));
    };
    this.toggleHidden = function(){
        document.getElementById("block-banner").classList.toggle("hidden");
    };
    this.eventDispatcher = function (evt) {
        if (this.basePoints.length < 3) {
            this.addBasePoint(evt);
        }
        else {
            return false;
        }
    };
    this.addBasePoint = function (evt) {

        this.pt.x = evt.clientX;
        this.pt.y = evt.clientY;
        var capturedPt = this.pt.matrixTransform(this.svg.getScreenCTM().inverse());
        var circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');

        circle.setAttribute('cx', capturedPt.x);
        circle.setAttribute('cy', capturedPt.y);
        circle.setAttribute('r', 11);
        circle.setAttribute('fill', 'red');
        circle.setAttribute('class', 'drag-handler');

        circle.clickData = {};

        this.bindDragHandlers(circle);
        this.svg.appendChild(circle);
        this.updateCoordsView(circle);
        if (this.basePoints.length === 3) {
            this.finalizePath()
        }
    };
    this.bindDragHandlers = function (el) {
        el.addEventListener('mousedown', this.dragStart.bind(this));
        el.addEventListener('mousemove', this.drag.bind(this));
        el.addEventListener('mouseup', this.dragStop.bind(this));
        el.addEventListener('mouseleave', this.dragStop.bind(this));
    };

    this.dragStart = function (evt) {
        evt.target.clickData.clicked = true;
        evt.target.clickData.clickX = evt.clientX;
        evt.target.clickData.clickY = evt.clientY;
    };
    this.drag = function (evt) {
        if (evt.target.clickData.clicked) {
            //use transform cos continuous update of svg coords is slow
            var dx = evt.clientX - evt.target.clickData.clickX;
            var dy = evt.clientY - evt.target.clickData.clickY;
            evt.target.setAttribute("transform", "translate(" + dx + "," + dy + ")");
        }
    };
    this.dragStop = function (evt) {
        if (evt.target.clickData.clicked) {
            evt.target.clickData.clicked = false;
            var dx = evt.clientX - evt.target.clickData.clickX;
            var dy = evt.clientY - evt.target.clickData.clickY;
            var newX = +evt.target.getAttribute('cx') + dx;
            var newY = +evt.target.getAttribute('cy') + dy;

            evt.target.setAttribute('cx', newX);
            evt.target.setAttribute('cy', newY);
            evt.target.setAttribute("transform", "translate(0)");
            this.updateCoordsView(evt.target);
            this.finalizePath();
        }
    };


    this.finalizePath = function () {

        var coordsA = this.basePoints[0].getAttribute('cx') + ' ' + this.basePoints[0].getAttribute('cy') + ', ';
        var coordsB = this.basePoints[1].getAttribute('cx') + ' ' + this.basePoints[1].getAttribute('cy') + ', ';
        var coordsC = this.basePoints[2].getAttribute('cx') + ' ' + this.basePoints[2].getAttribute('cy');
        var coords = coordsA + coordsB + coordsC;

        //calculate vector coordinates for parallelogram
        var AB = {};
        var BC = {};

        AB.x = this.basePoints[1].getAttribute('cx') - this.basePoints[0].getAttribute('cx');
        AB.y = this.basePoints[1].getAttribute('cy') - this.basePoints[0].getAttribute('cy');

        BC.x = this.basePoints[2].getAttribute('cx') - this.basePoints[1].getAttribute('cx');
        BC.y = this.basePoints[2].getAttribute('cy') - this.basePoints[1].getAttribute('cy');

        //get vector length
        AB.len = Math.sqrt(Math.pow(AB.x, 2) + Math.pow(AB.y, 2));
        BC.len = Math.sqrt(Math.pow(BC.x, 2) + Math.pow(BC.y, 2));

        var scalar = AB.x * BC.x + AB.y * BC.y;
       //get angle between two vectors data
        var cos = scalar / (AB.len * BC.len);
        var sin = Math.sqrt(1 - Math.pow(cos, 2));

        var S = AB.len * BC.len * sin;

        //get radius for circle
        var radius = Math.sqrt(S / Math.PI);

        //get mass center coords for parallelogram
        var massCenterX = (+this.basePoints[0].getAttribute('cx') + +this.basePoints[2].getAttribute('cx')) / 2;
        var massCenterY = (+this.basePoints[0].getAttribute('cy') + +this.basePoints[2].getAttribute('cy')) / 2;

        //get 4-th point of parallelogram
        var x = massCenterX * 2 - this.basePoints[1].getAttribute('cx');
        var y = massCenterY * 2 - this.basePoints[1].getAttribute('cy');

        var figure = document.getElementById('blue-parall');
        var circle = document.getElementById('yellow-circle');

        if (!figure && !circle) {
            figure = document.createElementNS("http://www.w3.org/2000/svg", 'polygon');
            circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
            this.svg.appendChild(figure);
            this.svg.appendChild(circle);

            figure.setAttribute('fill', 'transparent');
            figure.setAttribute('stroke', 'blue');
            figure.setAttribute('id', 'blue-parall');

            circle.setAttribute('fill', 'transparent');
            circle.setAttribute('stroke', 'gold');
            circle.setAttribute('id', 'yellow-circle');

        }

        figure.setAttribute('points', coords + ', ' + x + ' ' + y);

        circle.setAttribute('cx', massCenterX);
        circle.setAttribute('cy', massCenterY);
        circle.setAttribute('r', radius);

        this.areadata.innerHTML = Math.round(S);

        //put handlers ontop
        for (var i = 0; i < this.basePoints.length; i++) {
            this.svg.appendChild(this.basePoints[0]);
        }

    };
    this.updateCoordsView = function (el) {
        for (var i = 0; i < this.basePoints.length; i++) {
            if (el === this.basePoints[i]) {
                this.coordsdata[i].children[2].innerHTML = el.getAttribute('cx');
                this.coordsdata[i].children[4].innerHTML = el.getAttribute('cy');
            }
        }
    };
    this.reset = function () {
        while (this.svg.firstChild) {
            this.svg.removeChild(this.svg.firstChild);
        }
    };
    this.init();
};